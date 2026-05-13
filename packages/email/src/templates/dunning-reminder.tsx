import { Button, Heading, Hr, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/layout.js";
import { emailConfig } from "../config.js";

interface DunningReminderEmailProps {
  customerName: string;
  amount: string;
  currency: string;
  updatePaymentUrl: string;
  daysOverdue: number;
  gracePeriodEnds: string;
  willBeCanceled: boolean;
}

export function DunningReminderEmail({
  customerName = "Customer",
  amount = "$49.00",
  currency = "USD",
  updatePaymentUrl,
  daysOverdue = 3,
  gracePeriodEnds,
  willBeCanceled = false,
}: DunningReminderEmailProps) {
  const isUrgent = daysOverdue >= 7;
  const isFinal = willBeCanceled;

  const getSubject = () => {
    if (isFinal) return `Final Notice: Your subscription will be canceled`;
    if (isUrgent) return `Urgent: Payment overdue by ${daysOverdue} days`;
    return `Reminder: Payment overdue - action required`;
  };

  return (
    <EmailLayout preview={getSubject()}>
      <Heading style={isFinal ? headingFinal : isUrgent ? headingUrgent : heading}>
        {isFinal
          ? "Final Notice: Subscription Cancellation"
          : isUrgent
            ? "Urgent: Payment Overdue"
            : "Payment Reminder"}
      </Heading>

      <Text style={paragraph}>Hi {customerName},</Text>

      {isFinal ? (
        <>
          <div style={urgentBox}>
            <Text style={urgentText}>
              This is your <strong>final notice</strong>. Your subscription will be canceled on{" "}
              <strong>{gracePeriodEnds}</strong> if payment is not received.
            </Text>
          </div>

          <Text style={paragraph}>
            We've attempted to charge your payment method for{" "}
            <strong>
              {amount} {currency}
            </strong>{" "}
            multiple times without success. Your payment is now {daysOverdue} days overdue.
          </Text>

          <Text style={paragraph}>
            <strong>What happens next:</strong>
          </Text>
          <ul style={list}>
            <li style={listItem}>Your subscription will be canceled</li>
            <li style={listItem}>You'll lose access to premium features</li>
            <li style={listItem}>Your links will remain active on the free plan</li>
            <li style={listItem}>Analytics and advanced features will be disabled</li>
          </ul>
        </>
      ) : isUrgent ? (
        <>
          <div style={warningBox}>
            <Text style={warningText}>
              Your payment of{" "}
              <strong>
                {amount} {currency}
              </strong>{" "}
              is now <strong>{daysOverdue} days overdue</strong>.
            </Text>
          </div>

          <Text style={paragraph}>
            To avoid any interruption to your service, please update your payment method
            immediately. Your subscription will be canceled on <strong>{gracePeriodEnds}</strong> if
            we cannot process your payment.
          </Text>
        </>
      ) : (
        <>
          <Text style={paragraph}>
            This is a friendly reminder that your payment of{" "}
            <strong>
              {amount} {currency}
            </strong>{" "}
            is {daysOverdue} days overdue.
          </Text>

          <Text style={paragraph}>
            We want to make sure you don't lose access to your Go2 features. Please update your
            payment method at your earliest convenience.
          </Text>
        </>
      )}

      <Button style={isFinal ? buttonFinal : button} href={updatePaymentUrl}>
        {isFinal ? "Update Payment Now - Prevent Cancellation" : "Update Payment Method"}
      </Button>

      <Hr style={hr} />

      <Text style={smallText}>
        Need help? Simply reply to this email and our support team will assist you.
      </Text>

      {!isFinal && (
        <Text style={smallText}>
          <strong>Grace period:</strong> Your subscription will remain active until{" "}
          {gracePeriodEnds}. After that date, if payment isn't received, your subscription will be
          canceled.
        </Text>
      )}
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#f59e0b",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 24px",
};

const headingUrgent: React.CSSProperties = {
  ...heading,
  color: "#ea580c",
};

const headingFinal: React.CSSProperties = {
  ...heading,
  color: "#dc2626",
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

const warningBox: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  borderLeft: "4px solid #f59e0b",
  padding: "12px 16px",
  margin: "16px 0",
};

const warningText: React.CSSProperties = {
  color: "#92400e",
  fontSize: "14px",
  margin: "0",
};

const urgentBox: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #dc2626",
  padding: "12px 16px",
  margin: "16px 0",
};

const urgentText: React.CSSProperties = {
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

const buttonFinal: React.CSSProperties = {
  ...button,
  backgroundColor: "#dc2626",
};

const smallText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const list: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0 16px 0",
  paddingLeft: "24px",
};

const listItem: React.CSSProperties = {
  margin: "4px 0",
};

export default DunningReminderEmail;
