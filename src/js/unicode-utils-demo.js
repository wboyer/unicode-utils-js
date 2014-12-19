/*jshint multistr: true */

define(function ()
{
    function utf8Markup(uu, code)
    {
        var result = '<div class="utf-8">';

        var bytes = uu.codeToUtf8Bytes(code);

        var significantBitsFirstByte = 8;

        switch (bytes.length) {
            case 2:
                significantBitsFirstByte = 5;
                break;
            case 3:
                significantBitsFirstByte = 4;
                break;
            case 4:
                significantBitsFirstByte = 3;
                break;
        }

        for (var i = 0; i < bytes.length; i++) {
            var byte = bytes[i];

            var significantBits = 6;
            if (i === 0)
                significantBits = significantBitsFirstByte;

            var binary = byte.toString(2);
            while (binary.length < 8) {
                binary = "0" + binary;
                significantBits -= 1;
            }
            binary = binary.substr(0, 8 - significantBits) + '<span class="utf-8-byte-significant">' + binary.substr(8 - significantBits);

            result += '<div class="utf-8-byte">';
            result += byte.toString(16).toUpperCase() + " " + binary;
            result += '</div class="utf-8-byte">';
        }

        result += "</div>";

        return result;
    }

    function leftHeadingMarkup()
    {
        var result = '<div id="sequences-left-heading">';

        result += '<div class="character-heading">';

        result += '<div class="character-label">Character</div>';

        result += '<div class="composite-character">Composite</div>';

        result += '<div class="individual-character">Individual</div>';

        result += '<div class="code-point-value">Code Point</div>';

        result += '</div>';

        result += '<div class="representations-heading">';

        result += '<div class="representations-label">Encodings</div>';

        result += '<div class="utf-16">UTF-16</div>';

        result += '<div class="utf-8">UTF-8</div>';

        result += '</div>';

        return result;
    }

    function sequenceMarkup(uu, sequence)
    {
        var result = '<div class="sequence" data-str="' + sequence.string + '">';

        result += '<div class="composite-character">';
        result += sequence.string;
        result += "</div>";

        for (var i in sequence.codePoints) {
            var codePoint = sequence.codePoints[i];

            result += '<div class="code-point">';

            result += '<div class="individual-character">';
            result += codePoint.string;
            result += "</div>";

            result += '<div class="code-point-value">';
            result += uu.codeToHexString("U+", codePoint.value);
            result += "</div>";

            result += '<div class="utf-16">';
            result += uu.strToHexString("\\u", codePoint.string);
            result += "</div>";

            result += utf8Markup(uu, codePoint.value);

            result += "</div>";
        }

        result += "</div>";

        return result;
    }

    return {
        analyzeString: function (uu, string, echoDiv, breakdownDiv)
        {
            var numSequences = 0;
            var numCodePoints = 0;

            var sequences = uu.strToSequences(uu.strToCodePoints(string));
            var i, j;

            echoDiv.html("");
            for (i in sequences)
                echoDiv.append(sequences[i].string);

            var leftHeadingDiv = breakdownDiv.find("#sequences-left-heading");
            var sequencesDiv = breakdownDiv.find("#sequences");

            if (leftHeadingDiv.length && !sequences.length)
                leftHeadingDiv.attr("data-remove", true);
            else
                if (!leftHeadingDiv.length && sequences.length)
                    sequencesDiv.before(leftHeadingMarkup());

            var sequenceDivs = sequencesDiv.find(".sequence");

            for (i = 0, j = 0; i < sequences.length; i++, j++) {
                var sequence = sequences[i];
                var str = sequence.string;

                numSequences += 1;
                numCodePoints += sequence.codePoints.length;

                var existing = sequenceDivs.eq(j);
                var existingStr = existing.data("str");

                if (existingStr == str)
                    continue;

                if (j >= sequenceDivs.length) {
                    sequencesDiv.append(sequenceMarkup(uu, sequence));
                    continue;
                }

                if ((i < sequences.length - 1) && (existingStr == sequences[i + 1].string)) {
                    existing.before(sequenceMarkup(uu, sequence));

                    j--;
                    continue;
                }

                existing.attr("data-remove", true);
                numSequences -= 1;
                numCodePoints -= sequence.codePoints.length;
                i--;
            }

            sequenceDivs.slice(j).attr("data-remove", true);
            var removeDivs = breakdownDiv.find('[data-remove="true"]');

            function setWidth()
            {
                breakdownDiv.width((9 * numCodePoints + 0.1 * numSequences + 10) + "em");
            }

            if (removeDivs.length)
                removeDivs.animate({
                    opacity: 0
                }, 200, function ()
                {
                    removeDivs.remove();
                    setWidth();
                });
            else
                setWidth();

            //alert(input.selectionStart);
            var parent = breakdownDiv.parent();

            var scrollLeft = breakdownDiv.width() - parent.width();
            if (scrollLeft < 0)
                scrollLeft = 0;

            if (scrollLeft != parent.scrollLeft())
                parent.animate({
                    scrollLeft: scrollLeft
                }, 100);
        },

        analyzeCode: function (uu, code, echoDiv, breakdownDiv)
        {
            var str = "";

            var number = new RegExp('\\s*\\\\u([0-9|a-f|A-F]+)|\\s*U\\+([0-9|a-f|A-F]+)|\\s*0x([0-9|a-f|A-F]+)|\\s*([0-9]+)');
            var match = code.match(number);

            while (match) {
                var int;

                if (match[1])
                    int = parseInt("0x" + match[1]);
                else
                    if (match[2])
                        int = parseInt("0x" + match[2]);
                    else
                        if (match[3])
                            int = parseInt("0x" + match[3]);
                        else
                            if (match[4])
                                int = parseInt(match[4]);
                            else
                                break;

                if (isNaN(int))
                    break;

                if (match[1])
                    str += String.fromCharCode(int);
                else
                    str += uu.codeToUtf16String(int);

                code = code.substr(match[0].length);
                match = code.match(number);
            }

            this.analyzeString(uu, str, echoDiv, breakdownDiv);
        },

        initDemo: function ($, uu, document)
        {
            var cssPath = '/dist/unicode-utils-js/dist/css/demo.css';

            if (document.createStyleSheet)
                document.createStyleSheet(cssPath);
            else
                $("head").append($("<link rel='stylesheet' href='" + cssPath + "' type='text/css' media='screen' />"));

            $("#demo").html(' \
                    <div id="demo-container"> \
                        <div id="character-entry"> \
                            <strong>Input</strong>: <input id="character-input" type="text" placeholder="type some emojis!"> \
                            <input id="character-checkbox" type="checkbox"> Numeric</input> \
                        </div> \
                        <div id="output-echo"> \
                            <strong>Echo</strong>: <div id="output-echo-scroll" /> \
                        </div> \
                        <div id="output-breakdown-scroll"> \
                            <strong>Breakdown</strong>: \
                            <div id="output-breakdown"> \
                                <div id="sequences" /> \
                            </div> \
                        </div> \
                    </div> \
                ');

            var self = this;

            function analyzeInput()
            {
                var input = $('#character-input').val();

                if ($('#character-checkbox').is(':checked'))
                    self.analyzeCode(uu, input, $('#output-echo-scroll'), $('#output-breakdown'));
                else
                    self.analyzeString(uu, input, $('#output-echo-scroll'), $('#output-breakdown'));
            }

            $("#character-input").bind("change input blur", analyzeInput);
            $("#character-checkbox").bind("change input blur", analyzeInput);

            $("#character-input").bind("keyup", function (event)
            {
                if (event.which == 13)
                    analyzeInput();
            });
        }
    };
});
