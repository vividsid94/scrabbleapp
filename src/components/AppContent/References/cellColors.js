export const getCellColors = (lightMode = 'dark') => {
  // Use the same gradients for both light and dark mode
  return {
    0: {
        value: "",
        color: "var(--board-color, white)",
    },
    1: {
        value: "",
        color: "linear-gradient(to right bottom, rgba(126, 214, 221, 0.5), rgba(126, 214, 221, 0.95))",
    },
    2: {
        value: "",
        color: "linear-gradient(to right bottom, rgba(114, 105, 214, 0.6), rgba(114, 105, 214, 0.95))",
    },
    3: {
        value: "",
        color: "linear-gradient(to right bottom, rgba(244, 159, 212, 0.6), rgba(244, 159, 212, 0.9))",
    },
    4: {
        value: "",
        color: "linear-gradient(to right bottom, rgba(206, 34, 34, 0.6), rgba(206, 34, 34, 0.9))",
    }
  };
};

// Keep the old export for backward compatibility
export const cellColors = getCellColors('dark'); 