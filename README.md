at production
1.add file .env
2.run server :pm2 start ./app/index.js --node-args="-r esm" --name server-prod

https://www.youtube.com/watch?v=NjYsXuSBZ5U

UFW

SSL CERBOT:
This certificate expires on 2024-02-09.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

https://www.youtube.com/watch?v=NjYsXuSBZ5U

# Deploying GenieBaddy stack on Ubuntu 20.04

> Detailed step by step procedure to deploying PERN(mysql, Express, React, Node) stack on Ubuntu 20.04 with NGINX and SSL

1.create new ec2:
ubuntu
create key pair
save the .pem at c://.ssh

connect :

ssh -i "c://program Files/.ssh/commisaire-2023.pem" ubuntu@ec2-3-67-113-2.eu-central-1.compute.amazonaws.com
sudo apt update
sudo apt upgrade -y

## 3. Copy github repo to sever

mkdir apps
cd apps
mkdir genieBaddy
cd genieBaddy

create key at linux:
ssh-keygen -t genieKey -C "tipusharim@gmail.com"

find the key at ~/.ssh
copy the public to git

clone the project repo

git clone git@github.com:matokvekal/geniebaddy_server.git

## 4. Install Node

sudo apt update
sudo apt install nodejs
node -v
sudo apt install npm
npm -v
run:
npm i in the projects

## 5. Install and Configure PM2 RUN NODE

npm install pm2@latest -g

npm install esm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

```

pm2 start ./app/index.js --node-args="-r esm" --name server-prod

run : pm2 startup


you get:sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

copy and paste into the terminal > enter
then:
pm2 save

Verify that the App is running

```

pm2 status

```

/////////////

## 6. Deploy React Frontend

Navigate to the client directory in our App code and run `npm run build`.

This will create a finalized production ready version of our react frontent in directory called `build`. The build folder is what the NGINX server will be configured to serve.

```

ubuntu@ip-172-31-20-1:~/apps/yelp-app/client$ ls
README.md build node_modules package-lock.json package.json public src
ubuntu@ip-172-31-20-1:~/apps/yelp-app/client$ cd build/
ubuntu@ip-172-31-20-1:~/apps/yelp-app/client/build$ ls
asset-manifest.json favicon.ico index.html logo192.png logo512.png manifest.json precache-manifest.ee13f4c95d9882a5229da70669bb264c.js robots.txt service-worker.js static
ubuntu@ip-172-31-20-1:~/apps/yelp-app/client/build$

```

## . Configure Environment Variables

we can use this :

export NODE_ENV=production
export MY_SQL_HOST=dbcommiss.....
export MY_SQL_USER=a...
export MY_SQL_PASSWORD=za....
export DOMAIN=www.commi..

then run :source .env

========================
at ~ create .env file with all env variable

Create a file called `.env` in `/home/ubuntu/`. The file does not need to be named `.env` and it does not need to be stored in `/home/ubuntu`

```

```

set -o allexport; source /home/ubuntu/.env; set +o allexport

```

printenv
to use it after system upload do:
open .profile
add: set -o allexport; source /home/ubuntu/.env; set +o allexport to end

## 7. install front end code ,

git pull npm i
npm run build

## 8.NGINX

sudo apt install nginx -y
sudo systemctl enable nginx
systemctl status nginx

```
Go AWS
select instance
at browser run the instance  public ip -3.67.113.2

go to security group and fix 80  and 443

go to
cd /etc/nginx/sites-available


There should be a server block called `default`

buy domain  for examplw namecheep
copy default file to domain name :
sudo cp default  commissaire.us

at root  change to the client build path

/home/ubuntu/apps/client/build

at server name add the domain name: with www  if no domain write the ip
        server_name commissaire.us www.commissaire.us 3.67.113.2;

add link
sudo ln -s /etc/nginx/sites-available/commissaire.us /etc/nginx/sites-enabled/

run
sudo systemctl restart nginx

check the ip on the browser      https://commissaire.us/loginuser
```

update the file :
server {
listen 80 ;
listen [::]:80;
root /home/ubuntu/apps/client/build;

        # Add index.php to the list if you are using PHP
        index index.html index.htm index.nginx-debian.html;

        server_name commissaire.us www.commissaire.us 3.67.113.2;

            location /api {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

sudo systemctl restart nginx

ad the file:(need for react apps)
location / {
try_files $uri /index.html;
}

```
The default server block is what will be responsible for handling requests that don't match any other server blocks. Right now if you navigate to your server ip, you will see a pretty bland html page that says NGINX is installed. That is the `default` server block in action.

We will need to configure a new server block for our website. To do that let's create a new file in `/etc/nginx/sites-available/` directory. We can call this file whatever you want, but I recommend that you name it the same name as your domain name for your app. In this example my website will be hosted at *sanjeev.xyz* so I will also name the new file `sanjeev.xyz`. But instead of creating a brand new file, since most of the configs will be fairly similar to the `default` server block, I recommend copying the `default` config.

```

cd /etc/nginx/sites-available
sudo cp default sanjeev.xyz

```

open the new server block file `sanjeev.xyz` and modify it so it matches below:

```

server {
listen 80;
listen [::]:80;

         root /home/ubuntu/apps/yelp-app/client/build;

        # Add index.php to the list if you are using PHP
        index index.html index.htm index.nginx-debian.html;

        server_name sanjeev.xyz www.sanjeev.xyz;

        location / {
                try_files $uri /index.html;
        }

         location /api {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

}

```

**Let's go over what each line does**

The first two lines `listen 80` and `listen [::]:80;` tell nginx to listen for traffic on port 80 which is the default port for http traffic. Note that I removed the `default_server` keyword on these lines. If you want this server block to be the default then keep it in

`root /home/ubuntu/apps/yelp-app/client/build;` tells nginx the path to the index.html file it will server. Here we passed the path to the build directory in our react app code. This directory has the finalized html/js/css files for the frontend.

`server_name sanjeev.xyz www.sanjeev.xyz;` tells nginx what domain names it should listen for. Make sure to replace this with your specific domains. If you don't have a domain then you can put the ip address of your ubuntu server.

The configuration block below is needed due to the fact that React is a Singe-Page-App. So if a user directly goes to a url that is not the root url like `https://sanjeev.xyz/restaurants/4` you will get a 404 cause NGINX has not been configured to handle any path ohter than the `/`. This config block tells nginx to redirect everything back to the `/` path so that react can then handle the routing.

```

        location / {
                try_files $uri /index.html;
        }

```

The last section is so that nginx can handle traffic destined to the backend. Notice the location is for `/api`. So any url with a path of `/api` will automatically follow the instructions associated with this config block. The first line in the config block `proxy_pass http://localhost:3001;` tells nginx to redirect it to the localhost on port 3001 which is the port that our backend process is running on. This is how traffic gets forwarded to the Node backend. If you are using a different port, make sure to update that in this line.

**Enable the new site**
```

sudo ln -s /etc/nginx/sites-available/sanjeev.xyz /etc/nginx/sites-enabled/
systemctl restart nginx

```


## 9. Enable Firewall

```

sudo ufw status
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
sudo ufw status

```

## 10. Enable SSL with Let's Encrypt
Nowadays almost all websites use HTTPS exclusively. Let's use Let's Encrypt to generate SSL certificates and also configure NGINX to use these certificates and redirect http traffic to HTTPS.

The step by step procedure is listed at:
https://certbot.eff.org/lets-encrypt/ubuntufocal-nginx.html


Install Certbot

```

sudo snap install --classic certbot

```

Prepare the Certbot command

```

sudo ln -s /snap/bin/certbot /usr/bin/certbot

```

Get and install certificates using interactive prompt

```

sudo certbot --nginx

```

## Authors
* **Sanjeev Thiyagarajan** - *CEO of Nothing*
```
