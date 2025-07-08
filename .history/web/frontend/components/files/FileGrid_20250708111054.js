// src/components/files/FileGrid.js
import React from "react";
import { Box, MediaCard, Button, Badge, Icon } from "@shopify/polaris";
import { NoteIcon, ImageIcon } from "@shopify/polaris-icons";

const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const FileGrid = ({ files, selectedFile, onFileSelect }) => {
  if (files.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        maxHeight: "300px",
        overflowY: "auto",
        padding: "8px",
        border: "1px solid var(--p-color-border-subdued)",
        borderRadius: "8px",
      }}
    >
      {files.map((file, index) => {
        const isSelected = selectedFile?.name === file.name;
        return (
          <div key={`${file.name}-${file.size}-${index}`} style={{ position: "relative" }}>
            <Box>
              <MediaCard portrait>
                <Box>
                  <div
                    style={{
                      height: "200px",
                      backgroundColor: "#f6f6f7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {VALID_IMAGE_TYPES.includes(file.type) ? (
                      <img
                        src={window.URL.createObjectURL(file)}
                        alt={file.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    ) : (
                      <Icon source={NoteIcon} />
                    )}
                    {isSelected && (
                      <div style={{ position: "absolute", top: "8px", right: "8px" }}>
                        <Badge tone="success">Selected</Badge>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: "12px", textAlign: "center" }}>
                    <Button onClick={() => onFileSelect(file)}>
                      {isSelected ? "Deselect" : "Select"}
                    </Button>
                  </div>
                </Box>
              </MediaCard>
            </Box>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(FileGrid);
