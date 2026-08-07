import { initialVocabulary } from './initialVocabulary.js';
import { vocabularyLevels2to5 } from './vocabularyLevels2to5.js';
import { vocabularyLevels3to5 } from './vocabularyLevels3to5.js';
import fs from 'fs';
import path from 'path';

export const allVocabulary = [
  ...initialVocabulary,
  ...vocabularyLevels2to5,
  ...vocabularyLevels3to5
];

export const syncImageUrlToLocalFiles = (wordName, newImageUrl, fullWordData = null) => {
  if (!wordName || !newImageUrl) return;

  const targetFiles = [
    { name: 'initialVocabulary.js', varName: 'initialVocabulary', path: path.resolve('backend/data/initialVocabulary.js') },
    { name: 'vocabularyLevels2to5.js', varName: 'vocabularyLevels2to5', path: path.resolve('backend/data/vocabularyLevels2to5.js') },
    { name: 'vocabularyLevels3to5.js', varName: 'vocabularyLevels3to5', path: path.resolve('backend/data/vocabularyLevels3to5.js') },
  ];

  let foundInLocalFiles = false;

  for (const fileObj of targetFiles) {
    if (!fs.existsSync(fileObj.path)) continue;
    try {
      const content = fs.readFileSync(fileObj.path, 'utf8');
      const arrayStart = content.indexOf('[');
      const arrayEnd = content.lastIndexOf(']');
      if (arrayStart === -1 || arrayEnd === -1) continue;

      const jsonStr = content.substring(arrayStart, arrayEnd + 1);
      const arr = JSON.parse(jsonStr);

      const targetIdx = arr.findIndex(
        item => item.word && item.word.toLowerCase().trim() === wordName.toLowerCase().trim()
      );

      if (targetIdx !== -1) {
        foundInLocalFiles = true;
        // Update ONLY the imageUrl in local seed file
        arr[targetIdx].imageUrl = newImageUrl;

        const updatedContent = `export const ${fileObj.varName} = ${JSON.stringify(arr, null, 2)};\n`;
        fs.writeFileSync(fileObj.path, updatedContent, 'utf8');
        break;
      }
    } catch (err) {
      console.error(`Error updating image in ${fileObj.name}:`, err.message);
    }
  }

  // If word was not found in existing local seed files and fullWordData is provided, append it
  if (!foundInLocalFiles && fullWordData) {
    try {
      const fileObj = targetFiles[0]; // initialVocabulary.js
      if (fs.existsSync(fileObj.path)) {
        const content = fs.readFileSync(fileObj.path, 'utf8');
        const arrayStart = content.indexOf('[');
        const arrayEnd = content.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1) {
          const jsonStr = content.substring(arrayStart, arrayEnd + 1);
          const arr = JSON.parse(jsonStr);
          const cleanWordObj = {
            word: fullWordData.word,
            translation: fullWordData.translation || '',
            phonetic: fullWordData.phonetic || '',
            category: fullWordData.category || 'General',
            level: Number(fullWordData.level) || 1,
            exampleSentenceEn: fullWordData.exampleSentenceEn || '',
            exampleSentenceEs: fullWordData.exampleSentenceEs || '',
            imageUrl: newImageUrl
          };
          arr.push(cleanWordObj);
          const updatedContent = `export const ${fileObj.varName} = ${JSON.stringify(arr, null, 2)};\n`;
          fs.writeFileSync(fileObj.path, updatedContent, 'utf8');
        }
      }
    } catch (err) {
      console.error('Error adding new word image to initialVocabulary.js:', err.message);
    }
  }

  // Also update in-memory allVocabulary array
  const memItem = allVocabulary.find(
    item => item.word && item.word.toLowerCase().trim() === wordName.toLowerCase().trim()
  );
  if (memItem) {
    memItem.imageUrl = newImageUrl;
  } else if (fullWordData) {
    allVocabulary.push({
      word: fullWordData.word,
      translation: fullWordData.translation || '',
      phonetic: fullWordData.phonetic || '',
      category: fullWordData.category || 'General',
      level: Number(fullWordData.level) || 1,
      exampleSentenceEn: fullWordData.exampleSentenceEn || '',
      exampleSentenceEs: fullWordData.exampleSentenceEs || '',
      imageUrl: newImageUrl
    });
  }
};
