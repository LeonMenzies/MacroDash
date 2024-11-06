import React, { useState } from 'react';
import { SignUpRequestT } from 'types/ApiTypes';
import { Link } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Alert, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface SignUpFormProps {
  user: SignUpRequestT;
  loading: boolean;
  errorMessage: string;
  handleFieldChange: (fieldName: keyof SignUpRequestT, value: string) => void;
  handleSignUp: () => void;
  onBlur: () => void;
}

export function SignUpForm({ user, loading, errorMessage, handleFieldChange, handleSignUp, onBlur }: SignUpFormProps) {
  const [confirmPassword, setConfirmPassword] = useState<string>("");
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
            label="First Name"
            type="text"
            placeholder="First Name"
            value={user.firstName}
            required
            fullWidth
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            onBlur={onBlur}
          />

          <TextField
            label="Last Name"
            type="text"
            placeholder="Last Name"
            value={user.lastName}
            required
            fullWidth
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            onBlur={onBlur}
          />

          <TextField
            label="Email"
            type="email"
            placeholder="Email"
            value={user.email}
            required
            fullWidth
            onChange={(e) => handleFieldChange('email', e.target.value)}
            onBlur={onBlur}
          />

          <TextField
            label="Password"
            type="password"
            placeholder="Password"
            value={user.password}
            required
            fullWidth
            onChange={(e) => handleFieldChange('password', e.target.value)}
            onBlur={onBlur}
          />

          <TextField
            label="Confirm Password"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            required
            fullWidth
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={onBlur}
          />

          <Button
            variant="outlined"
            onClick={handleSignUp}
            disabled={loading}
            fullWidth
            sx={{
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            Sign Up
          </Button>

          {errorMessage && (
            <Alert severity="error">{errorMessage}</Alert>
          )}

          <Typography align="center">
            Already have an account? <Link to="/login" style={{ color: theme.palette.primary.main }}>Login</Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}