import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        background: {
            default: "#e6f2ff", // Light blue color
        },
        primary: {
            main: "#1976d2", // You can adjust this to match your preferred primary color
        },
        secondary: {
            main: "#f50057", // You can adjust this to match your preferred secondary color
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: "#e6f2ff", // Ensure the body background is also light blue
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: "#ffffff", // White background for Paper components
                },
            },
        },
    },
});

export default theme;
