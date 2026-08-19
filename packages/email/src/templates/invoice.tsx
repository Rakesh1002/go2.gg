import { Button, Heading, Hr, Section, Text } from "@react-email/components";
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
  paidOn?: string;
  dueDate?: string;
}

export function InvoiceEmail({
  customerName = "there",
  invoiceNumber = "INV-0001",
  amount = "$9.00",
  currency = "USD",
  invoiceUrl,
  items = [{ description: "Go2 Pro — Monthly", amount: "$9.00" }],
  paidOn,
  dueDate,
}: InvoiceEmailProps) {
  return (
    <EmailLayout preview={`Payment received — ${amount} ${currency}`}>
      <Heading style={heading}>Payment received</Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>
        Thanks for being a {emailConfig.productName} customer. We've received your payment — here's
        your receipt.
      </Text>

      {/* Amount hero */}
      <Section style={amountCard}>
        <Text style={amountLabel}>Amount paid</Text>
        <Text style={amountValue}>{amount}</Text>
        {paidOn && <Text style={amountMeta}>Paid on {paidOn}</Text>}
      </Section>

      {/* Line items */}
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

      <Section style={buttonWrap}>
        <Button style={button} href={invoiceUrl}>
          View receipt
        </Button>
      </Section>

      <Text style={metaText}>
        Receipt {invoiceNumber}. You can view all your invoices and manage your subscription any
        time from your billing settings.
      </Text>

      <Text style={paragraph}>
        Questions about this charge? Just reply to this email — a real person reads it.
      </Text>

      <Text style={signoff}>— The {emailConfig.productName} team</Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "32px",
  margin: "0 0 24px",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const amountCard: React.CSSProperties = {
  backgroundColor: "#f0fdfa",
  border: `1px solid ${emailConfig.primaryColor}`,
  borderRadius: "10px",
  padding: "20px 24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const amountLabel: React.CSSProperties = {
  color: "#0f766e",
  fontSize: "13px",
  fontWeight: "600",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const amountValue: React.CSSProperties = {
  color: emailConfig.primaryColor,
  fontSize: "34px",
  fontWeight: "700",
  lineHeight: "40px",
  margin: "0",
};

const amountMeta: React.CSSProperties = {
  color: "#0f766e",
  fontSize: "13px",
  margin: "6px 0 0",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "12px 0",
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
  padding: "4px 0",
};

const totalLabel: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0",
};

const totalAmount: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0",
};

const buttonWrap: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "28px 0 8px",
};

const button: React.CSSProperties = {
  backgroundColor: emailConfig.primaryColor,
  borderRadius: "8px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  textAlign: "center" as const,
};

const metaText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0",
};

const signoff: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "24px 0 0",
};

export default InvoiceEmail;
