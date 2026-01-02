# Sui Transaction Explainer

A user-friendly web app that takes a Sui transaction digest and explains what happened in plain language.

![Sui Transaction Explainer](./screenshot_placeholder.png)

## Features

- **Transaction Parsing:** specific details fetched from Sui Mainnet RPC.
- **Human-Readable Summary:** Break down of balance changes, object mutations, and gas fees.
- **Visualization:** Simple flow representation of the transaction.
- **Deep Linking:** Support for pasting full explorer URLs.

## Tech Stack

- **Frontend:** React (Vite)
- **Styling:** TailwindCSS v4
- **Blockchain Integration:** `@mysten/sui` SDK

## Architecture

The application follows a standard Single Page Application (SPA) architecture, running entirely in the browser.

1.  **Input Layer**: User inputs a transaction digest or URL.
2.  **Data Layer**: `src/lib/sui.ts` initializes the `SuiClient` from `@mysten/sui`. It queries the Sui Mainnet Fullnode via JSON-RPC to fetch transaction blocks (`sui_getTransactionBlock`).
3.  **Processing Layer**: The raw JSON response is parsed to extract:
    - **Move Calls**: Identifies which function was executed (e.g., `nft::mint`).
    - **Balance Changes**: Calculates net SUI flow for addresses.
    - **Object Modifications**: Filters outcomes into Created, Mutated, or Deleted objects, cleaning up type names for readability.
4.  **Presentation Layer**: a React component tree (`TxInput`, `TxVisualizer`, `TxSummary`) renders the parsed data using TailwindCSS for styling.

No backend server is required; the app communicates directly with public blockchain nodes.

    ```bash
    npm install
    ```

2.  **Run Development Server:**

    ```bash
    npm run dev
    ```

3.  **Build for Production:**
    ```bash
    npm run build
    ```

## Deployment

This app is a static site (SPA) and can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, etc.).

**Build Command:** `npm run build`
**Output Directory:** `dist`

## Data Source

This application queries the public Sui Mainnet fullnode (`https://fullnode.mainnet.sui.io:443`). No API key is required for basic usage, but for high traffic, you may want to configure a custom RPC provider in `src/lib/sui.ts`.
