import { Button, Heading, Hr, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface InvoiceEmailProps {
  customerName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  invoiceUrl: string;
  items: Array<{ description: string; amount: string }>;
  dueDate?: string;
}

export function InvoiceEmail({
  customerName = "Customer",
  invoiceNumber = "INV-0001",
  amount = "$49.00",
  currency = "USD",
  invoiceUrl,
  items = [{ description: "Pro Plan - Monthly", amount: "$49.00" }],
  dueDate,
}: InvoiceEmailProps) {
  return (
    <EmailLayout preview={`Invoice ${invoiceNumber} for ${amount}`}>
      <Heading style={heading}>Invoice {invoiceNumber}</Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>Thank you for your purchase! Here's a summary of your invoice:</Text>

      <Hr style={hr} />

      {items.map((item, index) => (
        <div key={index} style={lineItem}>
          <Text style={itemDescription}>{item.description}</Text>
          <Text style={itemAmount}>{item.amount}</Text>
        </div>
      ))}

      <Hr style={hr} />

      <div style={totalRow}>
        <Text style={totalLabel}>Total ({currency})</Text>
        <Text style={totalAmount}>{amount}</Text>
      </div>

      {dueDate && (
        <Text style={paragraph}>
          <strong>Due date:</strong> {dueDate}
        </Text>
      )}

      <Button style={button} href={invoiceUrl}>
        View Invoice
      </Button>

      <Text style={paragraph}>
        If you have any questions about this invoice, please reply to this email or contact our
        support team.
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 24px",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "16px 0",
};

const lineItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
};

const itemDescription: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  margin: "0",
};

const itemAmount: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  margin: "0",
  fontWeight: "500",
};

const totalRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
};

const totalLabel: React.CSSProperties = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const totalAmount: React.CSSProperties = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const button: React.CSSProperties = {
  backgroundColor: emailConfig.primaryColor,
  borderRadius: "6px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  margin: "24px 0",
};

export default InvoiceEmail;
