## FRONTEND

### First time installation
npm install -g @ionic/cli <br />
sudo gem install -n /usr/local/bin cocoapods
cd frontend <br />
npm install <br />
ionic build <br />
ionic cap add ios <br />
ionic cap add android

### Start the frontend server with:
ionic serve

### To reflect your changes in the simulator:
ionic build <br />
npx cap sync <br />
npx cap run ios / npx cap run android


## BACKEND
cd backend <br />
brew install redis (make sure you start it after installing) <br />
npm install <br />

### Start the backend server with:
yarn dev

## CONTACT YOUR MANAGER TO GET ACCESS TO .ENV FILES