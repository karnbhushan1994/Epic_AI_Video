import { Page, Card, Text } from "@shopify/polaris";

export default function Video() {
  return (
    <Page title="This is a page">
      <Card sectioned>
        <Text as="p" variant="bodyMd">
          This is a simple Shopify app page using Polaris.
        </Text>
      </Card>
    </Page>
  );
}
