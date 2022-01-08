
/* -------------------- CONVERTERS -------------------- */

// --> Converts single file to provided final format and save back in the file
export const convertLinksAndSaveInSingleFile = async (mdFile: TFile, finalFormat: 'markdown' | 'wiki') => {
    let fileText = await plugin.app.vault.read(mdFile);
    let newFileText =
        finalFormat === 'markdown' ? await convertWikiLinksToMarkdown(fileText, mdFile) : await convertMarkdownLinksToWikiLinks(fileText, mdFile);
    let fileStat = {};
    await plugin.app.vault.modify(mdFile, newFileText, fileStat);
};

/* -------------------- LINKS TO MARKDOWN CONVERTER -------------------- */

// --> Converts links within given string from Wiki to MD
export const convertWikiLinksToMarkdown = async (md: string, sourceFile: TFile): Promise<string> => {
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
        let wikiTransclusionLink = createLink('mdTransclusion', wikiTransclusion.linkText, wikiTransclusion.altOrBlockRef, sourceFile, plugin);
        newMdText = newMdText.replace(wikiTransclusion.match, wikiTransclusionLink);
    }
    return newMdText;
};

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


const getAllLinkMatchesInFile = async (mdFile: TFile): Promise<LinkMatch[]> => {
    const linkMatches: LinkMatch[] = [];
    let fileText = await read(mdFile);

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
