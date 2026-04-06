This folder contains the compiled Next.js static export for the customer web app.

To populate this folder, run from the project root:
  build-customer-fe.bat

The build script will:
  1. npm install  (in Fe-Customer/)
  2. npm run build  (outputs to Fe-Customer/out/)
  3. Copy all files from Fe-Customer/out/ into this folder

After copying, restart table-service to serve the updated frontend.
Customer web will be accessible at: http://localhost:3011
