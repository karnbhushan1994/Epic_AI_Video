import React, { useState } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Link,
  List,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";

function HelpSupport() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@epicapp.store").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Page title="Help & Support" fullWidth>
      <Layout>
        <Layout.Section oneHalf>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Contact Us
              </Text>
              <Text variant="bodyMd" as="p">
                Can't find what you're looking for? Reach out to our support
                team.
              </Text>
              <List type="bullet">
                <List.Item>
                  Email us on:{" "}
                  <Text
                    as="span"
                    fontWeight="medium"
                    tone="accent"
                    onClick={handleCopyEmail}
                    cursor="pointer"
                    underline
                  >
                    support@epicapp.store
                  </Text>
                  {copied && (
                    <InlineStack align="center" gap="100">
                      <Icon source={CheckCircleIcon} tone="success" />
                      <Text tone="success">Email id copied to clipboard</Text>
                    </InlineStack>
                  )}
                </List.Item>
                <List.Item>
                  Support Portal:{" "}
                  <Link url="https://support.epicapp.store/support/tickets/new" external>
                    Raise support ticket here
                  </Link>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default HelpSupport;
