console.log(getRelativeLink('动画/vrta/tea/1.jpg', '1.jpg'));
/**
 *
 * @param sourceFilePath Path of the file, in which the links are going to be used
 * @param linkedFilePath File path, which will be referred in the source file
 * @returns
 */
function getRelativeLink(sourceFilePath, linkedFilePath) {
    function trim(arr) {
        var start = 0;
        for (; start < arr.length; start++) {
            if (arr[start] !== '')
                break;
        }
        var end = arr.length - 1;
        for (; end >= 0; end--) {
            if (arr[end] !== '')
                break;
        }
        if (start > end)
            return [];
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
/* -------------------- TRANSCLUSIONS -------------------- */
var wikiTransclusionRegex = /\[\[(.*?)#.*?\]\]/;
var wikiTransclusionFileNameRegex = /(?<=\[\[)(.*)(?=#)/;
var wikiTransclusionBlockRef = /(?<=#).*?(?=]])/;
var mdTransclusionRegex = /\[.*?]\((.*?)#.*?\)/;
var mdTransclusionFileNameRegex = /(?<=\]\()(.*)(?=#)/;
var mdTransclusionBlockRef = /(?<=#).*?(?=\))/;
var matchIsWikiTransclusion = function (match) {
    return wikiTransclusionRegex.test(match);
};
var matchIsMdTransclusion = function (match) {
    return mdTransclusionRegex.test(match);
};
/**
 * @param match
 * @returns file name if there is a match or empty string if no match
 */
var getTransclusionFileName = function (match) {
    var isWiki = wikiTransclusionRegex.test(match);
    var isMd = mdTransclusionRegex.test(match);
    if (isWiki || isMd) {
        var fileNameMatch = match.match(isWiki ? wikiTransclusionFileNameRegex : mdTransclusionFileNameRegex);
        if (fileNameMatch)
            return fileNameMatch[0];
    }
    return '';
};
/**
 * @param match
 * @returns block ref if there is a match or empty string if no match
 */
var getTransclusionBlockRef = function (match) {
    var isWiki = wikiTransclusionRegex.test(match);
    var isMd = mdTransclusionRegex.test(match);
    if (isWiki || isMd) {
        var blockRefMatch = match.match(isWiki ? wikiTransclusionBlockRef : mdTransclusionBlockRef);
        if (blockRefMatch)
            return blockRefMatch[0];
    }
    return '';
};
