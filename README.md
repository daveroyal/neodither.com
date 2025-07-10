# Neo Dither - Advanced Image Effects Web App

A modern, Photoshop-like web application for applying stunning effects to images. Built with React, TypeScript, and Canvas API, featuring a comprehensive suite of retro, gaming, and artistic effects.

## Features

### 🎨 Effects Available

#### Retro & Gaming Effects
- **VHS Glitch**: Classic VHS tape distortion with scanlines, noise, and color shift
- **90s Internet**: Retro web aesthetics with pixelation and dithering
- **NES Classic**: 8-bit Nintendo nostalgia with pixelated graphics
- **Sega Genesis**: 16-bit Sega blast processing with enhanced saturation
- **Super Nintendo**: 16-bit Nintendo smoothness with color boost
- **Sega CD**: FMV compression artifacts and video processing effects
- **Shadowrun**: Cyberpunk-inspired retro gaming aesthetic

#### Artistic Effects
- **Glitch**: Digital glitch effects with RGB channel separation and random artifacts
- **Lo-Fi**: Low fidelity aesthetic with reduced saturation and grain
- **Cyberpunk**: Neon cyberpunk style with high contrast and blue tint
- **Film Grain**: Classic film grain texture and noise
- **Sepia**: Warm vintage sepia tone conversion
- **Vintage**: Aged photograph aesthetic with color fading
- **Neon**: Glowing neon light effects
- **Color Pop**: Vibrant color enhancement
- **Black & White**: Classic monochrome conversion
- **Polaroid**: Instant film camera aesthetic
- **Cross Process**: Alternative film development look
- **Emboss**: 3D embossed texture effect
- **Edge Detect**: Outline and edge detection
- **Vignette**: Darkened corners for dramatic focus

#### Technical Effects
- **Blur**: Gaussian blur for depth of field
- **Sharpen**: Image sharpening and detail enhancement
- **Infrared**: Infrared photography simulation
- **Thermal**: Thermal imaging color mapping
- **Color Adjustments**: Hue, saturation, and brightness controls
- **Dither**: Ordered and Floyd-Steinberg dithering
- **Upscaling**: AI-enhanced image upscaling with multiple algorithms

### 🛠️ Advanced Features

- **Layer System**: Photoshop-style layer management with opacity and blend modes
- **History Panel**: Complete edit history with undo/redo functionality
- **Real-time Preview**: Live effect preview before applying
- **Export Options**: High-quality image export with custom settings
- **Dark/Light Theme**: Toggle between themes
- **Keyboard Shortcuts**: Professional-grade keyboard shortcuts
- **Zoom Controls**: Multiple zoom levels and fit-to-screen options
- **Tool Panel**: Selection, move, crop, rotate, and drawing tools

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd neo-dither
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Basic Workflow

1. **Upload an Image**: Click the upload button or drag and drop an image file
2. **Select an Effect**: Choose from the categorized effects in the right panel
3. **Adjust Parameters**: Use the sliders to fine-tune effect parameters
4. **Preview**: See real-time preview of your changes
5. **Apply**: Apply the effect to create a new layer
6. **Export**: Download your final image in high quality

### Layer Management

- **Create Layers**: Each effect creates a new layer
- **Opacity Control**: Adjust layer transparency
- **Blend Modes**: Choose from various blend modes (Normal, Multiply, Screen, etc.)
- **Layer Visibility**: Toggle layers on/off
- **Layer Locking**: Prevent accidental edits

### Keyboard Shortcuts

- `V` - Selection tool
- `H` - Move tool
- `C` - Crop tool
- `R` - Rotate tool
- `Z` - Zoom tool
- `F` - Fit to screen
- `1` - Actual size
- `B` - Brush tool
- `E` - Eraser tool
- `T` - Text tool
- `G` - Fill tool

## Technical Details

### Built With

- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Canvas API**: Real-time image processing and manipulation
- **Lucide React**: Beautiful icon library

### Architecture

- **Component-Based**: Modular React components for maintainability
- **Canvas Processing**: Real-time image effects using Canvas API
- **State Management**: React hooks for efficient state management
- **Effect System**: Custom Canvas-based image filters and transformations
- **Layer Compositing**: Advanced layer blending and compositing

## Project Structure

```
neo-dither/
├── components/          # React components
│   ├── Canvas.tsx      # Main canvas component
│   ├── EffectsPanel.tsx # Effects selection and parameters
│   ├── LayerPanel.tsx  # Layer management
│   ├── HistoryPanel.tsx # Edit history
│   ├── ToolPanel.tsx   # Drawing and editing tools
│   ├── ExportDialog.tsx # Export functionality
│   └── Wallpaper.tsx   # Background wallpaper
├── src/
│   ├── utils/
│   │   └── effects.ts  # All image processing effects
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── public/             # Static assets
└── package.json        # Dependencies and scripts
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Inspired by classic image editing software like Photoshop and GIMP
- Built with modern web technologies for optimal performance
- Designed for ease of use while providing professional-grade features
- Retro gaming effects inspired by classic console aesthetics
