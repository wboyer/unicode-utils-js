/*jshint multistr: true */

define(function ()
{
    return {
        codeToUtf8Bytes: function (code)
        {
            var bytes = [];

            if (code <= 0x7F)
                bytes.unshift(code);
            else {
                var leadingBits = 0x6;

                while (code > 0) {
                    var last6 = code & 0x3F;
                    bytes.unshift(0x80 | last6);
                    code = code >> 6;

                    if (code < (1 << (6 - bytes.length))) {
                        leadingBits = leadingBits << (6 - bytes.length);
                        bytes.unshift(leadingBits | code);
                        code = 0;
                    }
                    else
                        leadingBits = (leadingBits + 1) << 1;
                }
            }

            return bytes;
        },

        codeToUtf16String: function (code)
        {
            if (code < 0xD800)
                return String.fromCharCode(code);
            else
                if ((code >= 0xD800) && (code < 0xE000))
                    return null;
                else
                    if ((code >= 0xE000) && (code < 0x10000))
                        return String.fromCharCode(code);
                    else
                        if ((code >= 0x10000) && (code < 0x110000)) {
                            code -= 0x10000;
                            return String.fromCharCode((code >> 10) + 0xD800, (code & 0x3FF) + 0xDC00);
                        }
                        else
                            return -1;
        },

        codeToHexString: function (prefix, code)
        {
            var pad = 0x10000;

            if (code >= pad)
                pad = pad << 1;
            code += pad;

            return prefix + code.toString(16).substr(1).toUpperCase();
        },

        strToHexString: function (prefix, str)
        {
            var result = "";

            for (var i in str) {
                if (i > 0)
                    result += " ";
                result += this.codeToHexString(prefix, str.charCodeAt(i));
            }

            return result;
        },

        strToCodePoints: function (string)
        {
            var codePoints = [];

            for (var i = 0; i < string.length; i++) {
                var j = i;
                var c = string.charCodeAt(i);

                // combine surrogate pairs
                if ((c >= 0xD800) && (c < 0xDBFF))
                    c = ((c - 0xD800) << 10) + (string.charCodeAt(++j) - 0xDC00) + 0x10000;

                codePoints.push({ string: string.slice(i, j + 1), value: c });

                i = j;
            }

            return codePoints;
        },

        strToSequences: function (codePoints)
        {
            var sequences = [];

            for (var i = 0; i < codePoints.length; i++) {
                var codePoint = codePoints[i];
                var c = codePoint.value;

                var j = i + 1;

                if (j < codePoints.length) {
                    var nextCodePoint = codePoints[j];
                    var nc = nextCodePoint.value;

                    var sequenceType = null;

                    // look for various types of multi-character sequences
                    if ((nc >= 0xFE00) && (nc < 0xFE10))
                        sequenceType = 'Variation';
                    else
                        if ((nc >= 0xE0100) && (nc < 0xE01F0))
                            sequenceType = 'Supplemental Variation';
                        else
                            if ((nc >= 0x180B) && (nc < 0x180E))
                                sequenceType = 'Mongolian';
                            else
                                if ((c >= 0x1F1E6) && (c < 0x1F200) &&
                                    (nc >= 0x1F1E6) && (nc < 0x1F200))
                                    sequenceType = 'Regional';

                    if (sequenceType) {
                        sequences.push({ string: codePoint.string + nextCodePoint.string, codePoints: [codePoint, nextCodePoint] });
                        i = j;
                        continue;
                    }
                }

                sequences.push({ string: codePoint.string, codePoints: [codePoint] });
            }

            return sequences;
        }
    };
});
