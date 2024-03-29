import {
  metaLineInvalid,
  formatCardLines,
  cardLinesValid,
  getImportErrors,
  extractMetaValue,
  convertImportToDeck
} from './import-utils';
import { META_KEYS } from '../constants/deck';
import { initializeDeckBuilder } from './deck-utils';

describe('Import utility methods', () => {
  describe('Test extractMetaValue', () => {
    it('should return the trimmed meta value of a line - all present', function() {
      const input = [
        'name: my deck',
        'power:  my power',
        'path: ',
        'coverart: my  coverart  ',
        '1 card',
        '2 cards'
      ];

      expect(extractMetaValue(input, META_KEYS.NAME)).toBe('my deck');
      expect(extractMetaValue(input, META_KEYS.POWER)).toBe('my power');
      expect(extractMetaValue(input, META_KEYS.PATH)).toBe('');
      expect(extractMetaValue(input, META_KEYS.COVER_ART)).toBe('my  coverart');
    });

    it('should return the trimmed meta value of a line - partial', function() {
      const input = [
        'name: my deck',
        'power:  my power',
        'path: ',
        '1 card',
        '2 cards'
      ];

      expect(extractMetaValue(input, META_KEYS.NAME)).toBe('my deck');
      expect(extractMetaValue(input, META_KEYS.POWER)).toBe('my power');
      expect(extractMetaValue(input, META_KEYS.PATH)).toBe('');
      expect(extractMetaValue(input, META_KEYS.COVER_ART)).toBe('');
    });

    it('should return the trimmed meta value of a line - invalid input', function() {
      expect(extractMetaValue(null, META_KEYS.NAME)).toBe(null);
      expect(extractMetaValue(1, META_KEYS.POWER)).toBe(null);
      expect(extractMetaValue([1, 2, 'a'], META_KEYS.PATH)).toBe(null);
      expect(extractMetaValue({ a: 'a' }, META_KEYS.COVER_ART)).toBe(null);
    });
  });

  describe('Test metaLineInvalid', () => {
    it('should return true if the meta line is invalid', function() {
      expect(metaLineInvalid(null)).toBe(true);
      expect(metaLineInvalid(1, null)).toBe(true);
      expect(metaLineInvalid('abc', null)).toBe(true);
      expect(metaLineInvalid([], null)).toBe(true);
      expect(metaLineInvalid([1, 'abc'], null)).toBe(true);
      expect(metaLineInvalid(null, META_KEYS.NAME)).toBe(true);
      expect(metaLineInvalid(1, META_KEYS.NAME)).toBe(true);
      expect(metaLineInvalid('', META_KEYS.NAME)).toBe(true);
      expect(metaLineInvalid('hi', META_KEYS.NAME)).toBe(true);
      expect(metaLineInvalid('name', META_KEYS.NAME)).toBe(true);
      expect(metaLineInvalid('path pathy path', META_KEYS.NAME)).toBe(true);
    });

    it('should return false if the meta line is valid - name', function() {
      expect(metaLineInvalid('name: decky', META_KEYS.NAME)).toBe(false);
      expect(metaLineInvalid('name: decky-deck', META_KEYS.NAME)).toBe(false);
      expect(metaLineInvalid('name: my deck name', META_KEYS.NAME)).toBe(false);
      expect(metaLineInvalid('name: my deck name', META_KEYS.NAME)).toBe(false);
      expect(metaLineInvalid('name:no space deck', META_KEYS.NAME)).toBe(false);
    });

    it('should return false if the meta line is valid - path, power, coverart', function() {
      expect(metaLineInvalid('path: my deck path', META_KEYS.PATH)).toBe(false);
      expect(metaLineInvalid('path: ', META_KEYS.PATH)).toBe(false);
      expect(metaLineInvalid('path:', META_KEYS.PATH)).toBe(false);
      expect(metaLineInvalid('power:    lots of spaces', META_KEYS.POWER)).toBe(
        false
      );
      expect(metaLineInvalid('power: ', META_KEYS.POWER)).toBe(false);
      expect(metaLineInvalid('power:', META_KEYS.POWER)).toBe(false);
      expect(metaLineInvalid('coverart: myself', META_KEYS.COVER_ART)).toBe(
        false
      );
      expect(metaLineInvalid('coverart: ', META_KEYS.COVER_ART)).toBe(false);
      expect(metaLineInvalid('coverart:', META_KEYS.COVER_ART)).toBe(false);
    });
  });

  describe('Test formatCardLines', () => {
    it('should format the line for each card - multiple valid lines', function() {
      const input = ['1 card name', '2 other card name', '3 weird  card  name'];

      const expected = [
        { id: 'TBD', quantity: 1, name: 'card name' },
        { id: 'TBD', quantity: 2, name: 'other card name' },
        { id: 'TBD', quantity: 3, name: 'weird  card  name' }
      ];
      expect(formatCardLines(input)).toEqual(expected);
    });

    it('should format the line for each card - multiple valid lines with empty lines', function() {
      const input = [
        '1 card name',
        '2 other card name',
        '',
        ' ',
        '3 weird  card  name'
      ];

      const expected = [
        { id: 'TBD', quantity: 1, name: 'card name' },
        { id: 'TBD', quantity: 2, name: 'other card name' },
        { id: 'TBD', quantity: 3, name: 'weird  card  name' }
      ];
      expect(formatCardLines(input)).toEqual(expected);
    });

    it('should format the line for each card - single valid line', function() {
      const input = ['1 card name'];
      const expected = [{ id: 'TBD', quantity: 1, name: 'card name' }];
      expect(formatCardLines(input)).toEqual(expected);
    });

    it('should format the line for each card - all invalid lines', function() {
      expect(formatCardLines([])).toEqual([]);
      expect(formatCardLines(['wow', 'much', 1])).toEqual(['wow', 'much']);
      expect(formatCardLines([1])).toEqual([]);
      expect(formatCardLines(['wow'])).toEqual(['wow']);
      expect(formatCardLines(['hellow world', 'hi universe'])).toEqual([
        'hellow world',
        'hi universe'
      ]);
    });

    it('should format the line for each card - some invalid lines', function() {
      const input = [
        '1 card name',
        3,
        '2 other card name',
        '',
        '3 weird  card  name',
        'wow'
      ];

      const expected = [
        { id: 'TBD', quantity: 1, name: 'card name' },
        { id: 'TBD', quantity: 2, name: 'other card name' },
        { id: 'TBD', quantity: 3, name: 'weird  card  name' },
        'wow'
      ];

      expect(formatCardLines(input)).toEqual(expected);
    });
  });

  describe('Test cardLinesValid', () => {
    it('should return true if all lines are valid cards', function() {
      const multipleCards = [
        { quantity: 1, name: 'card name' },
        { quantity: 2, name: 'other card name' },
        { quantity: 3, name: 'weird  card  name' }
      ];
      const singleCard = [{ quantity: 1, name: 'card name' }];

      expect(cardLinesValid(multipleCards)).toEqual(true);
      expect(cardLinesValid(singleCard)).toEqual(true);
      expect(cardLinesValid([])).toEqual(true);
    });

    it('should return false if even one line is invalid - all invalid', function() {
      expect(cardLinesValid(['wow', 'much', 1])).toEqual(false);
      expect(cardLinesValid([1])).toEqual(false);
      expect(cardLinesValid(['wow'])).toEqual(false);
      expect(cardLinesValid(['hellow world', 'hi universe'])).toEqual(false);
    });

    it('should format the line for each card - some invalid lines', function() {
      const input = [
        { quantity: 1, name: 'card name' },
        3,
        { quantity: 2, name: 'other card name' },
        '',
        { quantity: 3, name: 'weird  card  name' },
        'wow'
      ];
      expect(cardLinesValid(input)).toEqual(false);
    });
  });

  describe('Test getImportErrors', () => {
    it('Should return an empty list of errors', function() {
      const multipleCards = [
        'name: my deck',
        'path: my path',
        'power: my power',
        'coverart: myself',
        '1 card name',
        '2 other card name',
        '3 weird  card  name'
      ].join('\n');
      const singleCard = [
        'name: my deck',
        'path: my path',
        'power: my power',
        'coverart: ',
        '1 card name'
      ].join('\n');
      const noPathOrPower = [
        'name: New Deck',
        'path: ',
        'power: ',
        '1 dune courser',
        '1 mirage',
        '2 aimless vessel',
        '1 cataphract'
      ].join('\n');
      const sideboardMultiple = [
        '1 card name',
        '2 other card name',
        '3 weird  card  name'
      ].join('\n');
      const sideboardSingle = ['1 card name'].join('\n');

      expect(getImportErrors(multipleCards, sideboardSingle)).toEqual([]);
      expect(getImportErrors(multipleCards, sideboardMultiple)).toEqual([]);
      expect(getImportErrors(singleCard, sideboardMultiple)).toEqual([]);
      expect(getImportErrors(singleCard, sideboardSingle)).toEqual([]);
      expect(getImportErrors(singleCard, '')).toEqual([]);
      expect(getImportErrors(multipleCards, '')).toEqual([]);
      expect(getImportErrors(noPathOrPower, '')).toEqual([]);
      expect(getImportErrors(noPathOrPower, sideboardSingle)).toEqual([]);
      expect(getImportErrors(noPathOrPower, sideboardMultiple)).toEqual([]);
    });

    it('should show an empty list of errors - empty lines', function() {
      const main = [
        'name: my deck',
        'path: my path',
        'power: my power',
        '1 card name',
        '2 other card name',
        '',
        ' ',
        '3 weird  card  name'
      ].join('\n');

      const sidebar = [
        '1 card name',
        '2 other card name',
        '',
        ' ',
        '3 weird  card  name'
      ].join('\n');

      expect(getImportErrors(main, sidebar)).toEqual([]);
    });

    it('should show a list of errors - import with no metalines', function() {
      const input = [
        '1 card name',
        '2 other card name',
        '',
        ' ',
        '3 weird  card  name'
      ].join('\n');

      expect(getImportErrors(input, input)).toEqual([]);
    });

    it('should return a list of errors - invalid cards', function() {
      const input = [
        '1 card name',
        '2 other card name',
        'bladiblah',
        '3 weird  card  name',
        'bladiblah'
      ].join('\n');

      const expected = [
        'Invalid input for main deck',
        'Invalid input for sideboard'
      ];

      expect(getImportErrors(input, input)).toEqual(expected);
    });

    it('should show a list of errors - empty input', function() {
      expect(getImportErrors('', '')).toEqual(['Deck must have cards']);
      expect(getImportErrors(null, '')).toEqual([
        'Invalid input for main deck'
      ]);
    });
  });

  describe('Test convertImportToDeck', () => {
    it('Should convert an import to a deck in progress - single card', function() {
      const input = [
        'name: my deck',
        'path: my path',
        'power: my power',
        'coverart: ',
        '1 card name'
      ].join('\n');

      const result = convertImportToDeck(input, '');

      expect(result.errors.length).toEqual(0);
      expect(result.deckCoverArt).toEqual('');
      expect(result.deckName).toEqual('my deck');
      expect(result.deckPath).toEqual('my path');
      expect(result.deckPower).toEqual('my power');
      expect(Object.values(result.mainDeck).length).toEqual(1);
    });

    it('Should convert an import to a deck in progress - multiple cards', function() {
      const input = [
        'name: my deck',
        'path: my path',
        'power: my power',
        'coverart: myself',
        '1 card name',
        '2 other card name',
        '3 weird  card  name'
      ].join('\n');

      const result = convertImportToDeck(input, '');

      expect(result.errors.length).toEqual(0);
      expect(result.deckCoverArt).toEqual('myself');
      expect(result.deckName).toEqual('my deck');
      expect(result.deckPath).toEqual('my path');
      expect(result.deckPower).toEqual('my power');
      expect(Object.values(result.mainDeck).length).toEqual(3);
    });

    it('Should convert an import to a deck in progress - partial meta information', function() {
      const input = [
        'name: my deck',
        'power: my power',
        'coverart: myself',
        '1 card name',
        '2 other card name',
        '3 weird  card  name'
      ].join('\n');

      const result = convertImportToDeck(input, '');

      expect(result.errors.length).toEqual(0);
      expect(result.deckCoverArt).toEqual('myself');
      expect(result.deckName).toEqual('my deck');
      expect(result.deckPath).toEqual('');
      expect(result.deckPower).toEqual('my power');
      expect(Object.values(result.mainDeck).length).toEqual(3);
    });

    it('Should convert an import to a deck in progress - no meta information', function() {
      const input = [
        '1 card name',
        '2 other card name',
        '3 weird  card  name'
      ].join('\n');

      const result = convertImportToDeck(input, '');

      expect(result.errors.length).toEqual(0);
      expect(result.deckCoverArt).toEqual('');
      expect(result.deckName).toEqual('');
      expect(result.deckPath).toEqual('');
      expect(result.deckPower).toEqual('');
      expect(Object.values(result.mainDeck).length).toEqual(3);
    });

    it('Should convert an import to a deck in progress - empty lines', function() {
      const input = [
        'name: my deck',
        'path: my path',
        'power: my power',
        'coverart: ',
        '1 card name',
        '2 other card name',
        '',
        ' ',
        '3 weird  card  name'
      ].join('\n');

      const result = convertImportToDeck(input, '');

      expect(result.errors.length).toEqual(0);
      expect(result.deckCoverArt).toEqual('');
      expect(result.deckName).toEqual('my deck');
      expect(result.deckPath).toEqual('my path');
      expect(result.deckPower).toEqual('my power');
      expect(Object.values(result.mainDeck).length).toEqual(3);
    });

    it('Should not do anything besides populate errors - invalid cards', function() {
      const input = [
        '1 card name',
        '2 other card name',
        'bladiblah',
        '3 weird  card  name',
        'bladiblah'
      ].join('\n');

      const result = convertImportToDeck(input, '');

      expect(result.errors.length).toEqual(1);
      expect(result.deckCoverArt).toEqual('');
      expect(result.deckName).toEqual('');
      expect(result.deckPath).toEqual('');
      expect(result.deckPower).toEqual('');
      expect(Object.values(result.mainDeck).length).toEqual(0);
    });
  });
});
