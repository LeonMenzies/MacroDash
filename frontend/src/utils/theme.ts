import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Theme {
        customShadows: {
            light: string;
            dark: string;
        };
        customBorders: {
            radius: string;
        };
    }
    interface ThemeOptions {
        customShadows?: {
            light?: string;
            dark?: string;
        };
        customBorders?: {
            radius?: string;
        };
        customScrollbars?: {
            thumb: string;
            track: string;
        },
    }
}

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#b1c9e4',
            paper: '#ffffff',
        },
        text: {
            primary: '#000000',
            secondary: '#555555',
        },
    },
    customShadows: {
        light: 'rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
    },
    customBorders: {
        radius: '5px',
    },
    customScrollbars: {
        thumb: '#1976d2',
        track: '#dae9fd',
    },
});

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9',
        },
        secondary: {
            main: '#d24375',
        },
        background: {
            default: '#070f29',
            paper: '#1f2848',
        },
        text: {
            primary: '#ffffff',
            secondary: '#bbbbbb',
        },
    },
    customShadows: {
        dark: 'rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
    },
    customBorders: {
        radius: '5px',
    },
    customScrollbars: {
        thumb: '#90caf9',
        track: '#111a39',
    },
});