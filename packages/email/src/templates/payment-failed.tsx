import { Button, Heading, Hr, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface PaymentFailedEmailProps {
  customerName: string;
  invoiceNumber?: string;
  amount: string;
  currency: string;
  updatePaymentUrl: string;
  reason?: string;
  retryDate?: string;
}

export function PaymentFailedEmail({
  customerName = "Customer",
  invoiceNumber,
  amount = "$49.00",
  currency = "USD",
  updatePaymentUrl,
  reason,
  retryDate,
}: PaymentFailedEmailProps) {
  return (
    <EmailLayout preview={`Action required: Payment of ${amount} failed`}>
      <Heading style={heading}>Payment Failed</Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      <Text style={paragraph}>
        We were unable to process your payment of{" "}
        <strong>
          {amount} {currency}
        </strong>
        {invoiceNumber && ` for invoice ${invoiceNumber}`}.
      </Text>

      {reason && (
        <div style={reasonBox}>
          <Text style={reasonText}>
            <strong>Reason:</strong> {reason}
          </Text>
        </div>
      )}

      <Text style={paragraph}>
        To avoid any interruption to your service, please update your payment method as soon as
        possible.
      </Text>

      <Button style={button} href={updatePaymentUrl}>
        Update Payment Method
      </Button>

      {retryDate && (
        <Text style={paragraph}>
          We will automatically retry the payment on <strong>{retryDate}</strong>. If the payment
          fails again, your subscription may be paused.
        </Text>
      )}

      <Hr style={hr} />

      <Text style={smallText}>Common reasons for failed payments include:</Text>
      <ul style={list}>
        <li style={listItem}>Expired credit card</li>
        <li style={listItem}>Insufficient funds</li>
        <li style={listItem}>Card declined by your bank</li>
        <li style={listItem}>Incorrect billing information</li>
      </ul>

      <Text style={paragraph}>
        If you need assistance, please reply to this email or contact our support team. We're here
        to help!
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#dc2626",
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
  margin: "24px 0",
};

const reasonBox: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #dc2626",
  padding: "12px 16px",
  margin: "16px 0",
};

const reasonText: React.CSSProperties = {
  color: "#991b1b",
  fontSize: "14px",
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

const smallText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const list: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0 16px 0",
  paddingLeft: "24px",
};

const listItem: React.CSSProperties = {
  margin: "4px 0",
};

export default PaymentFailedEmail;
