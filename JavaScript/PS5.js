/**
 * Returns a list of objects grouped by some property. For example:
 * groupBy([{name: 'Steve', team:'blue'}, {name: 'Jack', team: 'red'}, {name: 'Carol', team: 'blue'}], 'team')
 *
 * returns:
 * { 'blue': [{name: 'Steve', team: 'blue'}, {name: 'Carol', team: 'blue'}],
 *    'red': [{name: 'Jack', team: 'red'}]
 * }
 *
 * @param {any[]} objects: An array of objects
 * @param {string|Function} property: A property to group objects by
 * @returns  An object where the keys representing group names and the values are the items in objects that are in that group
 */
function groupBy(objects, property) {
    // If property is not a function, convert it to a function that accepts one argument (an object) and returns that object's
    // value for property (obj[property])
    if(typeof property !== 'function') {
        const propName = property;
        property = (obj) => obj[propName];
    }

    const groupedObjects = new Map(); // Keys: group names, value: list of items in that group
    for(const object of objects) {
        const groupName = property(object);
        //Make sure that the group exists
        if(!groupedObjects.has(groupName)) {
            groupedObjects.set(groupName, []);
        }
        groupedObjects.get(groupName).push(object);
    }

    // Create an object with the results. Sort the keys so that they are in a sensible "order"
    const result = {};
    for(const key of Array.from(groupedObjects.keys()).sort()) {
        result[key] = groupedObjects.get(key);
    }
    return result;
}

// Initialize DOM elements that will be used.
const outputDescription = document.querySelector('#output_description');
const wordOutput = document.querySelector('#word_output');
const showRhymesButton = document.querySelector('#show_rhymes');
const showSynonymsButton = document.querySelector('#show_synonyms');
const wordInput = document.querySelector('#word_input');
const savedWords = document.querySelector('#saved_words');

// Stores saved words.
const savedWordsArray = [];

/**
 * Makes a request to Datamuse and updates the page with the
 * results.
 *
 * Use the getDatamuseRhymeUrl()/getDatamuseSimilarToUrl() functions to make
 * calling a given endpoint easier:
 * - RHYME: `datamuseRequest(getDatamuseRhymeUrl(), () => { <your callback> })
 * - SIMILAR TO: `datamuseRequest(getDatamuseRhymeUrl(), () => { <your callback> })
 *
 * @param {String} url
 *   The URL being fetched.
 * @param {Function} callback
 *   A function that updates the page.
 */
function datamuseRequest(url, callback) {
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            // This invokes the callback that updates the page.
            callback(data);
        }, (err) => {
            console.error(err);
        });
}

/**
 * Gets a URL to fetch rhymes from Datamuse
 *
 * @param {string} rel_rhy
 *   The word to be rhymed with.
 *
 * @returns {string}
 *   The Datamuse request URL.
 */
function getDatamuseRhymeUrl(rel_rhy) {
    return `https://api.datamuse.com/words?${(new URLSearchParams({'rel_rhy': wordInput.value})).toString()}`;
}

/**
 * Gets a URL to fetch 'similar to' from Datamuse.
 *
 * @param {string} ml
 *   The word to find similar words for.
 *
 * @returns {string}
 *   The Datamuse request URL.
 */
function getDatamuseSimilarToUrl(ml) {
    return `https://api.datamuse.com/words?${(new URLSearchParams({'ml': wordInput.value})).toString()}`;
}

/**
 * Add a word to the saved words array and update the #saved_words `<span>`.
 *
 * @param {string} word
 *   The word to add.
 */
function addToSavedWords(word) {
    let slicedWord = word.slice(0,-6);
    if (savedWordsArray.length == 0 ) {
        savedWords.innerHTML = slicedWord;
    }
    else{
        //append more words
        savedWords.append(", " + slicedWord);
    }
    savedWordsArray.push(slicedWord);
}


// Add additional functions/callbacks here.
function chooseRhyme() {
    //indicate the status of loading and searching the corresponding results
    wordOutput.innerHTML = "...loading";
    //retrieve the list of objects from the URL according to the typed-in word
    let rhymeURL = getDatamuseRhymeUrl(wordInput.value);
    //output the sentence that indicates the current mode
    outputDescription.innerHTML = `Words that rhyme with ${wordInput.value}:`;

    datamuseRequest(rhymeURL, (response) => {
        //re-initialize the contents of the output block
        wordOutput.innerHTML = "";
        //the console indicates that there is no corresponding results for this search
        if (response.length == 0) {
            wordOutput.textContent = "(no results)";
        //otherwise, the console results indicate that there is something associated with the word
        } else {
            //filter the search response according to a specific key type, and form different key-value pairs
            let groupedDict = groupBy(response,"numSyllables");

            //loop each single object from the grouped dictionary
            for (let key in groupedDict) {
                let group = groupedDict[key];
                //create a sub-header that indicates "Syllables: <>"
                const syllablesHeader = document.createElement("h3");
                //create unordered-element area that are under the control of the sub-header
                const listElement = document.createElement("ul")
                //edit the contents of the sub-header
                syllablesHeader.textContent = `Syllables: ${group[0]["numSyllables"]}`;
                //append the sub-header and unordered elements to the output area
                wordOutput.append(syllablesHeader);
                wordOutput.append(listElement);

                //loop each single object in the group
                for (let idx in group) {
                    //retrieve the values of the keys, including 'word' and 'numSyllables'
                    let word = group[idx]["word"]
                    let syllables = group[idx]["numSyllables"]
                    //create each single unordered element
                    const listItem = document.createElement("li");
                    listItem.innerHTML = `${word}</span><button class='btn btn-sm btn-outline-success save' type=button>(save)</button>`;
                    //append all the unordered elements to the unordered-element area
                    wordOutput.append(listItem);
                }
            }
        }
    })
}

function chooseSynonyms() {
    //indicate the status of loading and searching the corresponding results
    wordOutput.innerHTML = "...loading";
    //the console indicates that there is no corresponding results for this search
    let synonymURL = getDatamuseSimilarToUrl(wordInput.value);
    //output the sentence that indicates the current mode
    outputDescription.innerHTML = `Words with a similar meaning to ${wordInput.value}:`;

    datamuseRequest(synonymURL, (response) => {
        //re-initialize the contents of the output block
        wordOutput.innerHTML = ""
        //the console indicates that there is no corresponding results for this search
        if (response.length == 0) {
            wordOutput.textContent = "(no results)";
        //otherwise, the console results indicate that there is something associated with the word
        } else {
            //loop each single object from the grouped dictionary
            for (let item in response) {
                //retrieve the value of <word> from the specific response
                const {word, score, syllables} = response[item];
                //create each single unordered element
                const listItem = document.createElement("li");
                listItem.innerHTML = `${word}</span><button class='btn btn-sm btn-outline-success save' type=button>(save)</button>`;
                //append all the unordered elements to the unordered-element area
                wordOutput.append(listItem);
            }
        }
    })
}

//the behavior of clicking the button <Show rhyming words> triggers the searching of rhyming words
showRhymesButton.addEventListener('click', (event) => {
    chooseRhyme();
})

//the behavior of pressing the input triggers the searching of rhyming words
wordInput.addEventListener('keydown', (event) => {
    if (event.keyCode === 13) {
        chooseRhyme();
    }
})

//the behavior of clicking the button <Show synonyms> triggers the searching of rhyming words
showSynonymsButton.addEventListener('click', (event) => {
    chooseSynonyms();
})

//the behavior of clicking the button <Show synonyms> triggers the searching of rhyming words
wordOutput.addEventListener("click", (event) => {
    if (event.target.classList.contains('save')) {
        addToSavedWords(event.target.parentElement.textContent);
    }
});