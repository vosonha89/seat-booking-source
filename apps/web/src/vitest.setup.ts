import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for TextEncoder/TextDecoder in jsdom
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
