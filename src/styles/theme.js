import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      '@keyframes blink': {
        '0%': { opacity: 1 },
        '50%': { opacity: 0 },
        '100%': { opacity: 1 },
      },
      body: {
        bg: '#1E1F2E',
        color: '#FFFFFF',
      }
    }
  },
  colors: {
    brand: {
      primary: '#1E1F2E',
      secondary: '#2D2E3E',
      accent: '#8E44FF',
      hover: '#363746',
      border: '#404150',
    },
    gray: {
      50: '#F7F7F8',
      100: '#ECECF1',
      200: '#D9D9E3',
      300: '#C5C5D2',
      400: '#ACACBE',
      500: '#8E8EA0',
      600: '#6E6E80',
      700: '#4A4A5A',
      800: '#2D2D3A',
      900: '#1E1F2E',
    }
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'brand.accent',
          color: 'white',
          _hover: {
            bg: 'brand.hover',
          }
        },
        ghost: {
          _hover: {
            bg: 'brand.hover',
          }
        }
      }
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'brand.secondary',
            borderRadius: 'md',
            _hover: {
              bg: 'brand.hover',
            },
            _focus: {
              bg: 'brand.hover',
              borderColor: 'brand.accent',
            }
          }
        }
      },
      defaultProps: {
        variant: 'filled',
      }
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'brand.secondary',
          borderRadius: 'xl',
        }
      }
    }
  }
});

export default theme; 
