import net from 'net';
import { prisma } from '../prisma';

export interface PrintReceiptOptions {
  isReprint?: boolean;
}

export class PrintService {
  /**
   * Builds formatted thermal receipt data and tries physical ESC/POS dispatch.
   * Disconnected physical printer will NEVER fail or cancel the order.
   */
  static async processOrderReceipt(order: any, options: PrintReceiptOptions = {}) {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'default_settings' },
    });

    const printerWidth = settings?.printerWidth || '80mm';
    const charWidth = printerWidth === '58mm' ? 32 : 48;

    const receiptText = this.buildReceiptText(order, settings, charWidth, options);
    const escposBuffer = this.buildEscposBuffer(order, settings, charWidth, options);

    let printedToHardware = false;
    let hardwareError: string | null = null;

    // If auto-print to hardware is enabled, try TCP socket dispatch
    if (settings?.autoPrintEnabled && settings.networkPrinterIp && settings.networkPrinterPort) {
      try {
        await this.sendToNetworkPrinter(
          settings.networkPrinterIp,
          settings.networkPrinterPort,
          escposBuffer
        );
        printedToHardware = true;
      } catch (err: any) {
        hardwareError = err.message || 'Thermal printer unreachable';
        // Note: Hardware failure does NOT crash or cancel order.
      }
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      displayOrderNumber: order.displayOrderNumber,
      printedToHardware,
      hardwareError,
      printerWidth,
      receiptText,
      formattedLines: receiptText.split('\n'),
      orderSummary: {
        orderNumber: order.orderNumber,
        displayOrderNumber: order.displayOrderNumber,
        orderType: order.orderType,
        tableNumber: order.tableNumber,
        status: order.status,
        kioskId: order.kioskId,
        createdAt: order.createdAt,
        totalOmr: (order.totalBaisa / 1000).toFixed(3),
        subtotalOmr: (order.subtotalBaisa / 1000).toFixed(3),
        taxOmr: (order.taxBaisa / 1000).toFixed(3),
      },
    };
  }

  /**
   * Dispatches raw ESC/POS bytes to Network Thermal Printer (TCP Port 9100)
   */
  static sendToNetworkPrinter(ip: string, port: number, data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.setTimeout(2000);

      client.connect(port, ip, () => {
        client.write(data, () => {
          client.end();
          resolve();
        });
      });

      client.on('timeout', () => {
        client.destroy();
        reject(new Error(`Printer timeout connecting to ${ip}:${port}`));
      });

      client.on('error', (err) => {
        client.destroy();
        reject(err);
      });
    });
  }

  /**
   * Generates readable thermal monospace text layout for receipt
   */
  static buildReceiptText(order: any, settings: any, width: number, options: PrintReceiptOptions): string {
    const center = (text: string) => {
      if (text.length >= width) return text;
      const leftPad = Math.floor((width - text.length) / 2);
      return ' '.repeat(leftPad) + text;
    };

    const row = (left: string, right: string) => {
      const space = width - left.length - right.length;
      if (space <= 0) return `${left} ${right}`;
      return left + ' '.repeat(space) + right;
    };

    const divider = '='.repeat(width);
    const thinDivider = '-'.repeat(width);

    const lines: string[] = [];

    // Header
    lines.push(center(settings?.restaurantNameEn || 'Muscat Grill & Cafe'));
    if (settings?.restaurantNameAr) {
      lines.push(center(settings.restaurantNameAr));
    }
    lines.push(center(settings?.addressEn || 'Muscat, Sultanate of Oman'));
    lines.push(center(`Tel: ${settings?.phone || '+968 24 123456'}`));
    lines.push(divider);

    // Order Info
    if (options.isReprint || (order.printCount && order.printCount > 1)) {
      lines.push(center('*** DUPLICATE / REPRINT RECEIPT ***'));
      lines.push(thinDivider);
    }

    lines.push(center(`ORDER ${order.displayOrderNumber}`));
    lines.push(center(`Terminal: ${order.kioskId || 'Kiosk-1'}`));
    const dateStr = new Date(order.createdAt).toLocaleString('en-GB', {
      timeZone: 'Asia/Muscat',
    });
    lines.push(row(`Date: ${dateStr}`, ''));
    lines.push(
      row(
        `Type: ${order.orderType === 'DINE_IN' ? 'DINE IN' : 'TAKEAWAY'}`,
        order.tableNumber ? `Table: ${order.tableNumber}` : ''
      )
    );
    lines.push(thinDivider);

    // Items
    for (const item of order.items || []) {
      const itemTitle = `${item.quantity} x ${item.productNameEn}`;
      const itemPrice = `${(item.totalPriceBaisa / 1000).toFixed(3)} OMR`;
      lines.push(row(itemTitle, itemPrice));

      // Modifiers
      if (item.selectedModifiersJson) {
        try {
          const mods = JSON.parse(item.selectedModifiersJson);
          for (const m of mods) {
            const modDelta =
              m.priceDeltaBaisa > 0 ? ` +${(m.priceDeltaBaisa / 1000).toFixed(3)}` : '';
            lines.push(`   + ${m.nameEn}${modDelta}`);
          }
        } catch {
          // ignore parsing error
        }
      }

      if (item.specialNotes) {
        lines.push(`   * Note: ${item.specialNotes}`);
      }
    }

    lines.push(thinDivider);

    // Financial Totals
    lines.push(row('Subtotal:', `${(order.subtotalBaisa / 1000).toFixed(3)} OMR`));
    if (settings?.isTaxEnabled) {
      const taxLabel = settings.isTaxIncludedInPrice ? 'Oman VAT (5% incl):' : 'Oman VAT (5%):';
      lines.push(row(taxLabel, `${(order.taxBaisa / 1000).toFixed(3)} OMR`));
    }
    lines.push(divider);
    lines.push(row('TOTAL DUE:', `${(order.totalBaisa / 1000).toFixed(3)} OMR`));
    lines.push(divider);

    // Payment Status Warning Banner
    if (order.status === 'PENDING_PAYMENT') {
      lines.push(center('********************************'));
      lines.push(center('PAYMENT STATUS: PENDING PAYMENT'));
      lines.push(center('PLEASE TAKE THIS RECEIPT'));
      lines.push(center('TO THE COUNTER TO PAY'));
      lines.push(center('********************************'));
    } else if (order.status === 'PAID') {
      const pMethod = order.payment?.paymentMethod || 'COUNTER';
      lines.push(center('********************************'));
      lines.push(center(`PAYMENT STATUS: PAID (${pMethod})`));
      if (order.payment?.receivedBaisa) {
        lines.push(
          row(
            'Received:',
            `${(order.payment.receivedBaisa / 1000).toFixed(3)} OMR`
          )
        );
        lines.push(
          row(
            'Change Given:',
            `${((order.payment.changeBaisa || 0) / 1000).toFixed(3)} OMR`
          )
        );
      }
      lines.push(center('********************************'));
    }

    // Footer
    lines.push('');
    lines.push(center(settings?.receiptFooterEn || 'Thank you for your visit!'));
    if (settings?.receiptFooterAr) {
      lines.push(center(settings.receiptFooterAr));
    }
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Builds raw ESC/POS byte buffer for thermal receipt printers
   */
  static buildEscposBuffer(order: any, settings: any, width: number, options: PrintReceiptOptions): Buffer {
    const parts: Buffer[] = [];

    const append = (bytes: number[]) => {
      parts.push(Buffer.from(bytes));
    };

    const appendText = (text: string) => {
      parts.push(Buffer.from(text + '\n', 'ascii'));
    };

    // Initialize printer
    append([0x1b, 0x40]);

    // Align Center
    append([0x1b, 0x61, 0x01]);

    // Double Height + Bold for Restaurant Name
    append([0x1b, 0x45, 0x01]); // Bold ON
    append([0x1d, 0x21, 0x01]); // Double height
    appendText(settings?.restaurantNameEn || 'Muscat Grill & Cafe');

    // Normal Text
    append([0x1d, 0x21, 0x00]); // Normal size
    append([0x1b, 0x45, 0x00]); // Bold OFF
    appendText(settings?.addressEn || 'Muscat, Sultanate of Oman');
    appendText(`Tel: ${settings?.phone || '+968 24 123456'}`);
    appendText('='.repeat(width));

    // Order Number (Extra Large Bold)
    append([0x1b, 0x45, 0x01]); // Bold ON
    append([0x1d, 0x21, 0x11]); // Double width & height
    appendText(`ORDER ${order.displayOrderNumber}`);

    append([0x1d, 0x21, 0x00]); // Normal
    append([0x1b, 0x45, 0x00]); // Bold OFF

    const dateStr = new Date(order.createdAt).toLocaleString('en-GB', {
      timeZone: 'Asia/Muscat',
    });
    appendText(`Date: ${dateStr}`);
    appendText(
      `Type: ${order.orderType === 'DINE_IN' ? 'DINE IN' : 'TAKEAWAY'} ${
        order.tableNumber ? `| Table: ${order.tableNumber}` : ''
      }`
    );
    appendText(`Kiosk: ${order.kioskId || 'Kiosk-1'}`);
    appendText('-'.repeat(width));

    // Align Left for items
    append([0x1b, 0x61, 0x00]);

    for (const item of order.items || []) {
      const line = `${item.quantity}x ${item.productNameEn}`;
      const price = `${(item.totalPriceBaisa / 1000).toFixed(3)} OMR`;
      const pad = Math.max(1, width - line.length - price.length);
      appendText(`${line}${' '.repeat(pad)}${price}`);

      if (item.selectedModifiersJson) {
        try {
          const mods = JSON.parse(item.selectedModifiersJson);
          for (const m of mods) {
            const mDelta =
              m.priceDeltaBaisa > 0 ? ` +${(m.priceDeltaBaisa / 1000).toFixed(3)}` : '';
            appendText(`   + ${m.nameEn}${mDelta}`);
          }
        } catch {
          // ignore
        }
      }
    }

    appendText('-'.repeat(width));

    // Totals
    const totalLine = `TOTAL: ${(order.totalBaisa / 1000).toFixed(3)} OMR`;
    append([0x1b, 0x61, 0x02]); // Align Right
    append([0x1b, 0x45, 0x01]); // Bold ON
    appendText(totalLine);
    append([0x1b, 0x45, 0x00]); // Bold OFF

    // Payment notice
    append([0x1b, 0x61, 0x01]); // Align Center
    appendText('='.repeat(width));

    if (order.status === 'PENDING_PAYMENT') {
      append([0x1b, 0x45, 0x01]);
      appendText('*** PAYMENT STATUS: PENDING PAYMENT ***');
      appendText('PLEASE PAY AT THE COUNTER');
      append([0x1b, 0x45, 0x00]);
    } else if (order.status === 'PAID') {
      append([0x1b, 0x45, 0x01]);
      appendText(`*** PAYMENT STATUS: PAID (${order.payment?.paymentMethod || 'COUNTER'}) ***`);
      append([0x1b, 0x45, 0x00]);
    }

    appendText('='.repeat(width));
    appendText(settings?.receiptFooterEn || 'Thank you for your visit!');
    appendText('\n\n\n');

    // Partial Cut command
    append([0x1d, 0x56, 0x41, 0x03]);

    return Buffer.concat(parts);
  }

  /**
   * Generates a test print receipt for printer verification
   */
  static async generateTestReceipt() {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'default_settings' },
    });

    const mockOrder = {
      id: 'test_order_preview',
      orderNumber: 9999,
      displayOrderNumber: '#9999',
      kioskId: 'Kiosk-1',
      orderType: 'DINE_IN',
      tableNumber: '7',
      status: 'PENDING_PAYMENT',
      subtotalBaisa: 3800,
      taxBaisa: 181,
      totalBaisa: 3800,
      createdAt: new Date(),
      items: [
        {
          productNameEn: 'Muscat Truffle Angus Burger',
          quantity: 1,
          totalPriceBaisa: 2800,
          selectedModifiersJson: JSON.stringify([
            { nameEn: 'Extra Melted Cheddar', priceDeltaBaisa: 250 },
            { nameEn: 'No Onions', priceDeltaBaisa: 0 },
          ]),
        },
        {
          productNameEn: 'Fresh Mint Lemonade',
          quantity: 1,
          totalPriceBaisa: 1000,
          selectedModifiersJson: JSON.stringify([
            { nameEn: 'Large (500ml)', priceDeltaBaisa: 300 },
          ]),
        },
      ],
    };

    return this.processOrderReceipt(mockOrder, { isReprint: false });
  }
}
