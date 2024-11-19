import React from "react";
import { LoginRequestT } from "types/ApiTypes";
import { Container, Box, TextField, Button, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface LoginFormProps {
    user: LoginRequestT;
    loading: boolean;
    errorMessage: string;
    handleFieldChange: (fieldName: keyof LoginRequestT, value: string) => void;
    handleLogin: () => void;
    onBlur: () => void;
}

export function LoginForm({
    user,
    loading,
    errorMessage,
    handleFieldChange,
    handleLogin,
    onBlur,
}: LoginFormProps) {
    const theme = useTheme();

    return (
        <Container maxWidth="xs">
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                height="100vh"
                bgcolor={theme.palette.background.default}
                color={theme.palette.text.primary}
            >
                <Box
                    component="form"
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    p={3}
                    width="100%"
                    borderRadius={1}
                    boxShadow="rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px"
                    bgcolor={theme.palette.background.paper}
                >
                    <TextField
                        label="Email"
                        type="email"
                        placeholder="Email"
                        value={user.email}
                        required
                        fullWidth
                        onChange={(e) =>
                            handleFieldChange("email", e.target.value)
                        }
                        onBlur={onBlur}
                    />

                    <TextField
                        label="Password"
                        type="password"
                        placeholder="Password"
                        value={user.password}
                        required
                        fullWidth
                        onChange={(e) =>
                            handleFieldChange("password", e.target.value)
                        }
                        onBlur={onBlur}
                    />

                    <Button
                        variant="outlined"
                        onClick={handleLogin}
                        disabled={loading}
                        fullWidth
                        sx={{
                            color: theme.palette.primary.main,
                            borderColor: theme.palette.primary.main,
                            "&:hover": {
                                backgroundColor: theme.palette.action.hover,
                                borderColor: theme.palette.primary.main,
                            },
                        }}
                    >
                        Login
                    </Button>

                    {errorMessage && (
                        <Alert severity="error">{errorMessage}</Alert>
                    )}
                </Box>
            </Box>
        </Container>
    );
}

export default LoginForm;
