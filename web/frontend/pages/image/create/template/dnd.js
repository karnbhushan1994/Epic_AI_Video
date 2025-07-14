      <Box padding="200">
        <InlineStack gap="200" blockAlign="center">
          <Badge tone={connected ? "success" : "critical"}>
            Socket.IO: {connected ? "Connected" : "Disconnected"}
          </Badge>
          {serverMessage && (
            <Text variant="bodySm" as="p" tone="subdued">
              Server: {serverMessage}
            </Text>
          )}
          {connectionStatus !== "Connected" && (
            <>
              <Badge
                tone={
                  connectionStatus === "Connecting" ||
                  connectionStatus === "Reconnecting"
                    ? "attention"
                    : "critical"
                }
              >
                WebSocket: {connectionStatus}
              </Badge>
              {connectionStatus === "Error" && (
                <Button
                  variant="tertiary"
                  size="micro"
                  onClick={() => window.location.reload()}
                >
                  Retry Connection
                </Button>
              )}
            </>
          )}
          {/* Display current IN_PROGRESS status */}
          {isIN_PROGRESS && currentStatus && (
            <Badge tone={getStatusTone(currentStatus)}>
              Status: {currentStatus.replace("_", " ")}
            </Badge>
          )}
        </InlineStack>
      </Box>