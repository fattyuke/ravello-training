#!/bin/bash

cd $RAVELLO_TRAINING_HOME
cd ./training-server
NODE_ENV="production" node server.js

