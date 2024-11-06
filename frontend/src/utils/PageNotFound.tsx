import React from "react";
import { Box, Typography, Button } from "@mui/material";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import { useNavigate } from "react-router-dom";

export const PageNotFound = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate("/");
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100vh"
            textAlign="center"
            bgcolor="background.default"
            color="text.primary"
            p={3}
        >
            <SentimentVeryDissatisfiedIcon sx={{ fontSize: "100px" }} />
            <Typography variant="h4" component="h1" gutterBottom>
                404 Page Not Found
            </Typography>
            <Typography variant="body1" gutterBottom>
                The page you are looking for does not exist.
            </Typography>
            <Button variant="contained" color="primary" onClick={handleGoHome}>
                Go to Home
            </Button>
        </Box>
    );
};
