import { PathLike } from 'graceful-fs';
import * as fs from 'hexo-fs';
import * as path from 'path';

type File = {
    id: string,
    path: string, // file path
    type: string,
    params: { 
        '0': string,
        '1': string,
        id: string // filename
    },
    source: PathLike // fullPath
}

/* -------------------- CONVERTERS -------------------- */

// --> Converts single file to provided final format and save back in the file
export const convertLinksAndSaveInSingleFile = async (mdFile: File) => {
    let fileText = fs.readFileSync(mdFile.source);
    let newFileText = await convertWikiLinksToMarkdown(fileText, mdFile);
    await fs.writeFile(<string>mdFile.source, newFileText);
};

/* -------------------- LINKS TO MARKDOWN CONVERTER -------------------- */

// --> Converts links within given string from Wiki to MD
export const convertWikiLinksToMarkdown = async (md: string, sourceFile: File): Promise<string> => {
    let newMdText = md;
    let linkMatches: LinkMatch[] = await getAllLinkMatchesInFile(sourceFile);
    // --> Convert Wiki Internal Links to Markdown Link
    let wikiMatches = linkMatches.filter((match) => match.type === 'wiki');
    for (let wikiMatch of wikiMatches) {
        let mdLink = createLink('markdown', wikiMatch.linkText, wikiMatch.altOrBlockRef, sourceFile);
        newMdText = newMdText.replace(wikiMatch.match, mdLink);
    }
    // --> Convert Wiki Transclusion Links to Markdown Transclusion
    let wikiTransclusions = linkMatches.filter((match) => match.type === 'wikiTransclusion');
    for (let wikiTransclusion of wikiTransclusions) {
        let wikiTransclusionLink = createLink('mdTransclusion', wikiTransclusion.linkText, wikiTransclusion.altOrBlockRef, sourceFile);
        newMdText = newMdText.replace(wikiTransclusion.match, wikiTransclusionLink);
    }
    return newMdText;
};

/* -------------------- HELPERS -------------------- */

const createLink = (dest: LinkType, originalLink: string, altOrBlockRef: string, sourceFile: File): string => {
    let finalLink = originalLink;
    let altText: string;

    let fileLink = decodeURI(finalLink);
    let file = { basename: sourceFile.id };
    finalLink = getRelativeLink(sourceFile.path, fileLink);

    if (dest === 'wiki') {
        // If alt text is same as the final link or same as file base name, it needs to be empty
        if (altOrBlockRef !== '' && altOrBlockRef !== decodeURI(finalLink)) {
            if (file && decodeURI(altOrBlockRef) === file.basename) {
                altText = '';
            } else {
                altText = '|' + altOrBlockRef;
            }
        } else {
            altText = '';
        }
        return `[[${decodeURI(finalLink)}${altText}]]`;
    } else if (dest === 'markdown') {
        // If there is no alt text specifiec and file exists, the alt text needs to be always the file base name
        if (altOrBlockRef !== '') {
            altText = altOrBlockRef;
        } else {
            altText = file ? file.basename : finalLink;
        }
        return `[${altText}](${encodeURI(finalLink)})`;
    } else {
        return '';
    }
};

/**
 *
 * @param sourceFilePath Path of the file, in which the links are going to be used
 * @param linkedFilePath File path, which will be referred in the source file
 * @returns
 */
function getRelativeLink(sourceFilePath: string, linkedFilePath: string) {
    function trim(arr: string[]) {
        let start = 0;
        for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
        }

        var end = arr.length - 1;
        for (; end >= 0; end--) {
            if (arr[end] !== '') break;
        }

        if (start > end) return [];
        return arr.slice(start, end - start + 1);
    }

    var fromParts = trim(sourceFilePath.split('/'));
    var toParts = trim(linkedFilePath.split('/'));

    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
        if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
        }
    }

    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length - 1; i++) {
        outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('/');
}
/* -------------------- LINK DETECTOR -------------------- */

type FinalFormat = 'relative-path' | 'absolute-path' | 'shortest-path';
type LinkType = 'markdown' | 'wiki' | 'wikiTransclusion' | 'mdTransclusion';

interface LinkMatch {
    type: LinkType;
    match: string;
    linkText: string;
    altOrBlockRef: string;
    sourceFilePath: string;
}


/* -------------------- TRANSCLUSIONS -------------------- */

const wikiTransclusionRegex = /\[\[(.*?)#.*?\]\]/;
const wikiTransclusionFileNameRegex = /(?<=\[\[)(.*)(?=#)/;
const wikiTransclusionBlockRef = /(?<=#).*?(?=]])/;

const mdTransclusionRegex = /\[.*?]\((.*?)#.*?\)/;
const mdTransclusionFileNameRegex = /(?<=\]\()(.*)(?=#)/;
const mdTransclusionBlockRef = /(?<=#).*?(?=\))/;

const matchIsWikiTransclusion = (match: string): boolean => {
    return wikiTransclusionRegex.test(match);
};

const matchIsMdTransclusion = (match: string): boolean => {
    return mdTransclusionRegex.test(match);
};

/**
 * @param match
 * @returns file name if there is a match or empty string if no match
 */
const getTransclusionFileName = (match: string): string => {
    let isWiki = wikiTransclusionRegex.test(match);
    let isMd = mdTransclusionRegex.test(match);
    if (isWiki || isMd) {
        let fileNameMatch = match.match(isWiki ? wikiTransclusionFileNameRegex : mdTransclusionFileNameRegex);
        if (fileNameMatch) return fileNameMatch[0];
    }
    return '';
};

/**
 * @param match
 * @returns block ref if there is a match or empty string if no match
 */
const getTransclusionBlockRef = (match: string) => {
    let isWiki = wikiTransclusionRegex.test(match);
    let isMd = mdTransclusionRegex.test(match);
    if (isWiki || isMd) {
        let blockRefMatch = match.match(isWiki ? wikiTransclusionBlockRef : mdTransclusionBlockRef);
        if (blockRefMatch) return blockRefMatch[0];
    }
    return '';
};


interface LinkMatch {
    type: LinkType;
    match: string;
    linkText: string;
    altOrBlockRef: string;
    sourceFilePath: string;
}


const getAllLinkMatchesInFile = async (mdFile: File): Promise<LinkMatch[]> => {
    const linkMatches: LinkMatch[] = [];
    let fileText = fs.readFileSync(mdFile.source);

    // --> Get All WikiLinks
    let wikiRegex = /\[\[.*?\]\]/g;
    let wikiMatches = fileText.match(wikiRegex);

    if (wikiMatches) {
        let fileRegex = /(?<=\[\[).*?(?=(\]|\|))/;
        let altRegex = /(?<=\|).*(?=]])/;

        for (let wikiMatch of wikiMatches) {
            // --> Check if it is Transclusion
            if (matchIsWikiTransclusion(wikiMatch)) {
                let fileName = getTransclusionFileName(wikiMatch);
                let blockRefMatch = getTransclusionBlockRef(wikiMatch);
                if (fileName !== '' && blockRefMatch !== '') {
                    let linkMatch: LinkMatch = {
                        type: 'wikiTransclusion',
                        match: wikiMatch,
                        linkText: fileName,
                        altOrBlockRef: blockRefMatch,
                        sourceFilePath: mdFile.path,
                    };
                    linkMatches.push(linkMatch);
                    continue;
                }
            }
            // --> Normal Internal Link
            let fileMatch = wikiMatch.match(fileRegex);
            if (fileMatch) {
                // Web links are to be skipped
                if (fileMatch[0].startsWith('http')) continue;
                let altMatch = wikiMatch.match(altRegex);
                let linkMatch: LinkMatch = {
                    type: 'wiki',
                    match: wikiMatch,
                    linkText: fileMatch[0],
                    altOrBlockRef: altMatch ? altMatch[0] : '',
                    sourceFilePath: mdFile.path,
                };
                linkMatches.push(linkMatch);
            }
        }
    }

    // --> Get All Markdown Links
    let markdownRegex = /\[(^$|.*?)\]\((.*?)\)/g;
    let markdownMatches = fileText.match(markdownRegex);

    if (markdownMatches) {
        let fileRegex = /(?<=\().*(?=\))/;
        let altRegex = /(?<=\[)(^$|.*?)(?=\])/;
        for (let markdownMatch of markdownMatches) {
            // --> Check if it is Transclusion
            if (matchIsMdTransclusion(markdownMatch)) {
                let fileName = getTransclusionFileName(markdownMatch);
                let blockRefMatch = getTransclusionBlockRef(markdownMatch);
                if (fileName !== '' && blockRefMatch !== '') {
                    let linkMatch: LinkMatch = {
                        type: 'mdTransclusion',
                        match: markdownMatch,
                        linkText: fileName,
                        altOrBlockRef: blockRefMatch,
                        sourceFilePath: mdFile.path,
                    };
                    linkMatches.push(linkMatch);
                    continue;
                }
            }
            // --> Normal Internal Link
            let fileMatch = markdownMatch.match(fileRegex);
            if (fileMatch) {
                // Web links are to be skipped
                if (fileMatch[0].startsWith('http')) continue;
                let altMatch = markdownMatch.match(altRegex);
                let linkMatch: LinkMatch = {
                    type: 'markdown',
                    match: markdownMatch,
                    linkText: fileMatch[0],
                    altOrBlockRef: altMatch ? altMatch[0] : '',
                    sourceFilePath: mdFile.path,
                };
                linkMatches.push(linkMatch);
            }
        }
    }
    return linkMatches;
};
