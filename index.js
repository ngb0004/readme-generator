var inquirer = require("inquirer");
var fs = require("fs");
//const axios = require("axios");

inquirer
    .prompt([
        {
        message: "what is your project title?",
        name: "title"
    },
    {
        message: "Write a description:",
        name: "description"
    },
    {
        message: "Enter installation instuctions:",
        name: "installation"
    },
    {
        message: "Enter usage information: ",
        name: "usage"
    },
    {   
        type: 'list',
        name: 'license',
        message: 'choose what license you have: ',
        choices: ['ISC', 'MIT', 'GPL', 'MPL'],
        default: "ISC"
    },
    {
        message: "Enter contributers: ",
        name: "contributions"
    },
    {
        message: "Enter test instructions: ",
        name: "tests"
    },
    {
        message: "Enter contact info (email): ",
        name: "email"
    },
    {
        message: "what is your GitHub username?",
        name: "username"
    }
    ])
    .then(function(response) {
        //console.log(response)

        

        const readme = 
        
        `# ${response.title} 

<a name="description"></a>
## Description

${response.description}
        
## Table of contents 
1. [ Description. ](#description)
2. [ Installation. ](#installation)
3. [ Usage. ](#usage)
4. [ License. ](#license)
5. [ Contributing. ](#contributing)
6. [ Tests. ](#tests)
7. [ Links. ](#links)
        
<a name="installation"></a>
## Installation

${response.installation}

<a name="usage"></a>
## Usage

${response.usage}

<a name="license"></a>
## License

License: ${response.license}

Permission to use, copy, modify, and/or distribute this software for any purpose 
with or without fee is hereby granted, provided that the above copyright notice 
and this permission notice appear in all copies.

<a name="contributing"></a>
## Contributions

${response.contributions}

<a name="tests"></a>
## Tests

${response.tests}

<a name="questions"></a>
## Questions

GitHub profile: https://github.com/${response.username}
Contact me at with any additional questions: ${response.email}
        

`
        fs.writeFile("README.md", readme, function(err){
            if (err) {
                throw err
            }
            console.log("Successfully created your README.md");
        })

    })
    
    
    
    
    // .then(function({ username }) {
    // const queryUrl = `https://api.github.com/users/${username}/repos?per_page=100`;
    
    // console.log();


    // axios.get(queryUrl).then(function(res) {
    //     console.log(res);
    // }

    