#!/usr/bin/env node

// Grab provided args

const [,, ...args] = process.argv
download = require("download-git-repo");
var fs = require('fs')
var Spinner = require('cli-spinner').Spinner;
var spinner = new Spinner('%s');
spinner.setSpinnerString('|/-\\')
main()
function main(){
    if(args.length > 0){
        command = args[0]
        if(command === 'init' && args.length === 2){
            project_name = args[1]
            init(project_name)
        }else if(command === 'generate' || command === 'g'){
           if(args.length > 2)
           {
                if (fs.existsSync('app')) {
                    command_func = args[1]
                    name = args[2]
                    if (command_func === "action"){
                        generateActions(name)
                    }else if (command_func === "reducer"){
                        generateReducers(name)
                    }else if(command_func === "container"){
                        generateContainers(name)
                    }else{
                        console.log('You can only generate either action or reducer')
                    }
                }else{
                    console.log('Please run this command in your react-native project directory.')
                }
            }else{
                console.log('Not enough parameter')
            }
        }
        else{
            console.log('Please only give one name for your project. Example: kangar init AwsomeProject.')
        }
    }else{
        console.log('You have not specified any command.')
        return
    }
}
function init(project_name){
    console.log('Creating project ' + project_name)
    console.log('Downloading react-native template.')
    downloadTemplate(project_name)
    
}
function downloadTemplate(project_name){
    spinner.start();
    download('valehelle/kangar-rn-template', project_name, function (err) {
        var exec = require('child_process').exec;
        spinner.stop()
        if (err) {
            return console.log(err)
        }
        console.log('\nFinish downloading react native template.')
        createAppJSON(project_name)
        editIndex(project_name)           
    })
}

function createAppJSON(project_name){
    var app_path = project_name + '/app.json'
    console.log('Creating app.json file.')
    var stream = fs.createWriteStream(app_path);
    stream.once('open', function(fd) {
        stream.write('{\n');
        stream.write('    "name": "' + project_name + '",\n')
        stream.write('    "displayName": "' + project_name + '"\n')
        stream.write('}');
        stream.end();
    });
    console.log('Successfully created app.json file.')
    console.log('Editing index.js file.')
}

function editIndex(project_name){
    var indexPath = project_name + '/index.js' 
    fs.readFile(indexPath, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/kangarTemplate/g, project_name)
                
        fs.writeFile(indexPath, result, 'utf8', function (err) {
            if (err) return console.log(err);
            console.log('Successfully edited index.js file.')
            console.log('Executing command npm install and react-native eject.')
            console.log('This may take several minutes.')
            spinner.start()
            var command = 'cd ' + project_name + ' && npm install && react-native eject '
            var exec = require('child_process').exec;
            exec(command,
                function (error, stdout, stderr) {
                    spinner.stop()
                    console.log('\nCommand executed successfully.')
                    console.log('\nFinish creating project ' + project_name + '.')
                });
        });
    }); 
}

function generateActions(name){
    var path = 'app/actions/' + name.toLowerCase() + '.js'
    var stream = fs.createWriteStream(path);
    stream.once('open', function(fd) {
        stream.write('import * as types from \'../helpers/type\'')
        stream.end();
    });
    linkActions(name)
}
function linkActions(name){
    var indexPath = 'app/actions/index.js'
    fs.readFile(indexPath, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var result = 'import * as ' + getActionName(name) + ' from \'./' + name.toLowerCase() + '\'\n' + data
        result = result.replace(/export const ActionCreators = Object.assign\({},/g, 'export const ActionCreators = Object.assign({},\n    ' + getActionName(name) + ',')
        fs.writeFile(indexPath, result, 'utf8', function (err) {
            if (err) return console.log(err);

        });
    }); 
}

function getActionName(name){
    var action_name = name.toLowerCase() + 'Actions'
    return action_name
}

function generateReducers(name){
    var path = 'app/reducers/' + name.toLowerCase() + '.js'
    var stream = fs.createWriteStream(path);
    stream.once('open', function(fd) {
        stream.write('import createReducer from \'./createReducer\'\n')
        stream.write('import * as types from \'../helpers/type\'\n\n')
        stream.write('export const ' + name + ' = createReducer({}, {})')
        stream.end();
    });
    linkReducers(name)
}

function linkReducers(name){
    var indexPath = 'app/reducers/index.js'
    fs.readFile(indexPath, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var result = 'import * as ' + getReducerName(name) + ' from \'./' + name.toLowerCase() + '\'\n' + data
        result = result.replace(/export default combineReducers\(Object.assign\(/g, 'export default combineReducers(Object.assign(\n    ' + getReducerName(name) + ',')
        fs.writeFile(indexPath, result, 'utf8', function (err) {
            if (err) return console.log(err);

        });
    }); 
}

function getReducerName(name){
    var action_name = name.toLowerCase() + 'Reducer'
    return action_name
}

function generateContainers(name){
    name = name.toLowerCase()
    var dirPath = 'app/containers/' + name
    try {
        fs.mkdirSync(dirPath)
        var viewPath = dirPath + '/view.js'
        var streamView = fs.createWriteStream(viewPath);
        streamView.once('open', function(fd) {
            streamView.write('import React, { Component } from \'react\'\n')
            streamView.write('import ReactNative from \'react-native\'\n')
            streamView.write('import { connect } from \'react-redux\'\n')
            streamView.write('const {\n    View,\n    Text,\n} = ReactNative\n\n')
            streamView.write('class ' + capitalizeFirstLetter(name) + ' extends Component{\n')
            streamView.write('    render(){\n')
            streamView.write('        return (\n            <View>' + name + ' container</View>\n        )\n    }\n}\n ')
            streamView.write('function mapStateToProps(state){\n    return {}\n}\n')
            streamView.write('export default connect(mapStateToProps)(' + capitalizeFirstLetter(name) + ')')
            streamView.end();
        });
  
        var stylePath = dirPath + '/style.js'
        var streamStyle = fs.createWriteStream(stylePath);
        streamStyle.once('open', function(fd) {
            streamStyle.write('import { StyleSheet } from \'react-native\'\n\n')
            streamStyle.write('export default StyleSheet.create({\n\n})')
            streamStyle.end();
        });
        linkContainers(name)
      } catch (err) {
        console.log('Container already exists.')
        if (err.code !== 'EEXIST') {
            throw err
        }
      }
}

function linkContainers(name){
    name = name.toLowerCase()
    var indexPath = 'app/containers/index.js'
    fs.readFile(indexPath, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var result = 'export {default as ' + name + '} from \'./' + name + '/view\'\n' + data 
        fs.writeFile(indexPath, result, 'utf8', function (err) {
            if (err) return console.log(err);

        });
    }); 
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}



