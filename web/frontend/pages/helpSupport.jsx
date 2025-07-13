import React from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Link,
  List,
} from "@shopify/polaris";

function HelpSupport() {
  return (
    <Page title="Help & Support" fullWidth>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Need help?
              </Text>
              <Text variant="bodyMd" as="p">
                We're here to assist you. Below you'll find resources to help
                answer your questions.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

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
                  Email:{" "}
                  <Link url="mailto:help@epic.app@store">
                    support@epic.app@store
                  </Link>
                </List.Item>
                <List.Item>
                  Support:{" "}
                  <Link url="https://support.epicapp.store/support/home">
                    https://support.epicapp.store/support/home
                  </Link>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Documentation</Text>
              <Text variant="bodyMd" as="p">
                Explore our comprehensive documentation for detailed guides and tutorials.
              </Text>
              <Link url="/documentation">View Documentation</Link>
            </BlockStack>
          </Card>
        </Layout.Section> */}
      </Layout>
    </Page>
  );
}

export default HelpSupport;
