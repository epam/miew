if [ "$TRAVIS_BRANCH" == "latest" ]; then
  DEPLOY_APP=ROOT
else
  DEPLOY_APP=${TRAVIS_BRANCH//[^A-Za-z0-9_\-.]/-}
fi

# pack the application
$JAVA_HOME/bin/jar cvf $DEPLOY_APP.war -C build .

# set identity
eval "$(ssh-agent -s)"
echo "$DEPLOY_KEY" > $DEPLOY_KEY_FILE
chmod 600 $DEPLOY_KEY_FILE
ssh-add $DEPLOY_KEY_FILE

# upload the application
scp $DEPLOY_APP.war $DEPLOY_USER@$DEPLOY_SERVER:.
ssh $DEPLOY_USER@$DEPLOY_SERVER "cd /opt/tomcat/webapps && sudo cp ~/$DEPLOY_APP.war"

# clean up
rm -f $DEPLOY_APP.war $DEPLOY_KEY_FILE 
