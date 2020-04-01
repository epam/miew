#!/bin/bash

echo "Starting deployment script for '$TRAVIS_BRANCH' branch (or tag)..."
if [ "$TRAVIS_BRANCH" == "latest" ]
then
  DEPLOY_APP=ROOT
else
  DEPLOY_APP=${TRAVIS_BRANCH//[^A-Za-z0-9_\-.]/-}
fi

# pack the application
echo "Packing '$DEPLOY_APP.war' app for tomcat..."
jar cvf $DEPLOY_APP.war -C build .

# set identity
echo "Running SSH agent..."
eval "$(ssh-agent -s)"
echo "Storing deployment key in a file..."
echo "$DEPLOY_KEY" > $DEPLOY_KEY_FILE
chmod 600 $DEPLOY_KEY_FILE
echo "Adding a deployment key..."
ssh-add $DEPLOY_KEY_FILE

# upload the application
echo "Uploading the application..."
scp -o "StrictHostKeyChecking=no" $DEPLOY_APP.war $DEPLOY_USER@$DEPLOY_SERVER:.
echo "Executing remote commands..."
ssh -o "StrictHostKeyChecking=no" $DEPLOY_USER@$DEPLOY_SERVER "cd /opt/tomcat/webapps && sudo cp ~/$DEPLOY_APP.war ."

# clean up
echo "Removing temporary files..."
rm -f $DEPLOY_APP.war $DEPLOY_KEY_FILE 
echo "Done."
