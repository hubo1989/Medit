import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  convertLatex2Math,
  convertMathMl2Math,
  convertMathMl2Omml,
  convertOmml2Math,
  mathJaxReady,
} from '../src/exporters/docx-math-converter.js';

// We also need latex2MathMl for testing, but it's not exported
// So we'll use MathJax directly for generating MathML in tests
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { SerializedMmlVisitor } from 'mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js';
import { STATE } from 'mathjax-full/js/core/MathItem.js';

// Setup test MathJax environment
const TEX_PACKAGES = AllPackages.filter((pkg) => pkg !== 'bussproofs');
const testAdaptor = liteAdaptor();
RegisterHTMLHandler(testAdaptor);
const testTex = new TeX({ packages: TEX_PACKAGES });
const testDocument = mathjax.document('', { InputJax: testTex });
const testVisitor = new SerializedMmlVisitor();

function latex2MathMl(latexString) {
  const mathNode = testDocument.convert(latexString, { display: false, end: STATE.CONVERT });
  return testVisitor.visitTree(mathNode);
}

// Wait for MathJax to be ready before running tests
await mathJaxReady();

describe('docx-math-converter', () => {
  describe('convertLatex2Math - basic LaTeX', () => {
    it('should convert simple variable', () => {
      const result = convertLatex2Math('x');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert superscript', () => {
      const result = convertLatex2Math('x^2');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert subscript', () => {
      const result = convertLatex2Math('x_1');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert fraction', () => {
      const result = convertLatex2Math('\\frac{a}{b}');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert square root', () => {
      const result = convertLatex2Math('\\sqrt{x}');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert nth root', () => {
      const result = convertLatex2Math('\\sqrt[3]{x}');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert sum with limits', () => {
      const result = convertLatex2Math('\\sum_{i=1}^{n} i');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert integral', () => {
      const result = convertLatex2Math('\\int_0^1 f(x) dx');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert matrix', () => {
      const result = convertLatex2Math('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert Greek letters', () => {
      const result = convertLatex2Math('\\alpha + \\beta = \\gamma');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert unsupported esint commands like oiint', () => {
      const result = convertLatex2Math('\\oiint_S \\vec{F} \\cdot d\\vec{S}');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
      // Check that the result contains the surface integral symbol (converted from \oiint)
      const jsonString = JSON.stringify(result);
      assert.ok(jsonString.includes('∯'), 'Should contain surface integral Unicode symbol');
    });

    it('should convert oiiint command', () => {
      const result = convertLatex2Math('\\oiiint_V \\rho \\, dV');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
      // Check that the result contains the volume integral symbol
      const jsonString = JSON.stringify(result);
      assert.ok(jsonString.includes('∰'), 'Should contain volume integral Unicode symbol');
    });
  });

  describe('convertLatex2Math - spacing commands', () => {
    // Helper to get OMML string from LaTeX
    function latexToOmml(latex) {
      const mathMl = latex2MathMl(latex);
      return convertMathMl2Omml(mathMl);
    }

    const EM_SPACE = '\u2003';
    const THIN_SPACE = '\u2009';
    const MEDIUM_SPACE = '\u2005';
    const THICK_SPACE = '\u2004';

    it('should preserve \\quad spacing', () => {
      const omml = latexToOmml('a \\quad b');
      assert.ok(omml.includes(EM_SPACE), 'Should contain em space for \\quad');
    });

    it('should preserve \\qquad spacing', () => {
      const omml = latexToOmml('a \\qquad b');
      // \qquad is 2em, should have two em spaces
      const emSpaceCount = (omml.match(new RegExp(EM_SPACE, 'g')) || []).length;
      assert.ok(emSpaceCount >= 2, 'Should contain at least two em spaces for \\qquad');
    });

    it('should preserve \\, (thin space)', () => {
      const omml = latexToOmml('a \\, b');
      assert.ok(omml.includes(THIN_SPACE), 'Should contain thin space for \\,');
    });

    it('should preserve \\: (medium space)', () => {
      const omml = latexToOmml('a \\: b');
      assert.ok(omml.includes(MEDIUM_SPACE), 'Should contain medium space for \\:');
    });

    it('should preserve \\; (thick space)', () => {
      const omml = latexToOmml('a \\; b');
      assert.ok(omml.includes(THICK_SPACE), 'Should contain thick space for \\;');
    });

    it('should preserve \\bmod spacing', () => {
      const omml = latexToOmml('a \\bmod b');
      assert.ok(omml.includes('mod'), 'Should contain "mod" text');
      assert.ok(omml.includes(THICK_SPACE), 'Should contain thick space for \\bmod');
    });

    it('should preserve \\bmod with superscript', () => {
      const omml = latexToOmml('V = T \\bmod 2^{31}');
      assert.ok(omml.includes('mod'), 'Should contain "mod" text');
      assert.ok(omml.includes(THICK_SPACE), 'Should contain thick space');
    });

    it('should preserve \\pmod spacing', () => {
      const omml = latexToOmml('a \\equiv b \\pmod{n}');
      assert.ok(omml.includes('mod'), 'Should contain "mod" text');
    });

    it('should preserve spacing after \\log', () => {
      const omml = latexToOmml('\\log n');
      assert.ok(omml.includes('log'), 'Should contain "log" text');
      assert.ok(omml.includes(THIN_SPACE), 'Should contain thin space after \\log');
    });

    it('should preserve spacing in O(n log n)', () => {
      const omml = latexToOmml('O(n \\log n)');
      assert.ok(omml.includes('log'), 'Should contain "log" text');
      assert.ok(omml.includes(THIN_SPACE), 'Should contain thin space');
    });

    it('should preserve spacing after \\sin', () => {
      const omml = latexToOmml('\\sin x');
      assert.ok(omml.includes('sin'), 'Should contain "sin" text');
      assert.ok(omml.includes(THIN_SPACE), 'Should contain thin space after \\sin');
    });

    it('should preserve spacing after \\cos', () => {
      const omml = latexToOmml('\\cos x');
      assert.ok(omml.includes('cos'), 'Should contain "cos" text');
      assert.ok(omml.includes(THIN_SPACE), 'Should contain thin space after \\cos');
    });

    it('should preserve spacing after \\sup', () => {
      const omml = latexToOmml('\\sup S');
      assert.ok(omml.includes('sup'), 'Should contain "sup" text');
      assert.ok(omml.includes(THIN_SPACE), 'Should contain thin space after \\sup');
    });

    it('should preserve spacing after \\inf', () => {
      const omml = latexToOmml('\\inf S');
      assert.ok(omml.includes('inf'), 'Should contain "inf" text');
      assert.ok(omml.includes(THIN_SPACE), 'Should contain thin space after \\inf');
    });
  });

  describe('convertMathMl2Math - direct MathML input', () => {
    it('should convert simple MathML', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math>';
      const result = convertMathMl2Math(mathMl);
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should convert MathML with mspace', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mspace width="1em"/><mi>b</mi></math>';
      const result = convertMathMl2Math(mathMl);
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle MathML with mfrac', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mi>a</mi><mi>b</mi></mfrac></math>';
      const result = convertMathMl2Math(mathMl);
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle MathML with msup (superscript)', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msup><mi>x</mi><mn>2</mn></msup></math>';
      const result = convertMathMl2Math(mathMl);
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle MathML with msub (subscript)', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>x</mi><mn>1</mn></msub></math>';
      const result = convertMathMl2Math(mathMl);
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle MathML with msqrt', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msqrt><mi>x</mi></msqrt></math>';
      const result = convertMathMl2Math(mathMl);
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });
  });

  describe('convertOmml2Math - direct OMML input', () => {
    it('should convert simple OMML', () => {
      const omml = '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:r><m:t>x</m:t></m:r></m:oMath>';
      const result = convertOmml2Math(omml);
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should throw error for invalid OMML (missing m:oMath)', () => {
      const invalidOmml = '<m:r xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:t>x</m:t></m:r>';
      assert.throws(() => {
        convertOmml2Math(invalidOmml);
      }, /Invalid OMML content/);
    });
  });

  describe('convertMathMl2Omml - space preprocessing', () => {
    const EM_SPACE = '\u2003';
    const THIN_SPACE = '\u2009';
    const MEDIUM_SPACE = '\u2005';
    const THICK_SPACE = '\u2004';

    it('should convert mspace width="1em" to em space', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mspace width="1em"/><mi>b</mi></math>';
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(omml.includes(EM_SPACE), 'Should contain em space');
    });

    it('should convert mspace width="2em" to double em space', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mspace width="2em"/><mi>b</mi></math>';
      const omml = convertMathMl2Omml(mathMl);
      const emSpaceCount = (omml.match(new RegExp(EM_SPACE, 'g')) || []).length;
      assert.ok(emSpaceCount >= 2, 'Should contain at least two em spaces');
    });

    it('should convert mspace width="0.167em" to thin space', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mspace width="0.167em"/><mi>b</mi></math>';
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(omml.includes(THIN_SPACE), 'Should contain thin space');
    });

    it('should convert mo with lspace to space before operator', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mo lspace="thickmathspace">+</mo><mi>b</mi></math>';
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(omml.includes(THICK_SPACE), 'Should contain thick space before operator');
    });

    it('should convert mo with rspace to space after operator', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mo rspace="thickmathspace">+</mo><mi>b</mi></math>';
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(omml.includes(THICK_SPACE), 'Should contain thick space after operator');
    });

    it('should convert invisible function application operator to thin space', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>f</mi><mo>&#x2061;</mo><mi>x</mi></math>';
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(omml.includes(THIN_SPACE), 'Should contain thin space for function application');
    });

    it('should handle self-closing mspace tag', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mspace width="1em" /><mi>b</mi></math>';
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(omml.includes(EM_SPACE), 'Should handle self-closing mspace');
    });

    it('should handle mspace with closing tag', () => {
      const mathMl = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mspace width="1em"></mspace><mi>b</mi></math>';
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(omml.includes(EM_SPACE), 'Should handle mspace with closing tag');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty LaTeX string', () => {
      const result = convertLatex2Math('');
      assert.ok(result);
    });

    it('should handle LaTeX with only whitespace', () => {
      const result = convertLatex2Math('   ');
      assert.ok(result);
    });

    it('should handle complex nested expressions', () => {
      const result = convertLatex2Math('\\frac{\\sqrt{x^2 + y^2}}{\\sum_{i=1}^{n} i^2}');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle multiple operators', () => {
      const result = convertLatex2Math('a + b - c \\times d \\div e');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle text within math', () => {
      const result = convertLatex2Math('x \\text{ is positive}');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle limits', () => {
      const result = convertLatex2Math('\\lim_{x \\to \\infty} f(x)');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle binomial coefficient', () => {
      const result = convertLatex2Math('\\binom{n}{k}');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle cases environment', () => {
      const result = convertLatex2Math('f(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x = 0 \\\\ -1 & x < 0 \\end{cases}');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle empty groups in prescripts', () => {
      // Empty groups like {} should not produce empty <m:e/> elements
      const result = convertLatex2Math('{}_a^b X');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle empty groups in isotope notation', () => {
      const result = convertLatex2Math('{}^{14}_6 C');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });

    it('should handle consecutive superscripts with empty group', () => {
      const result = convertLatex2Math('x^2{}^3');
      assert.ok(result);
      assert.strictEqual(result.rootKey, 'm:oMath');
    });
  });

  describe('convertMathMl2Omml - empty mrow handling', () => {
    const ZERO_WIDTH_SPACE = '\u200B';

    it('should not produce empty <m:e/> for prescripts', () => {
      const mathMl = latex2MathMl('{}_a^b X');
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(!omml.includes('<m:e/>'), 'Should not contain empty <m:e/>');
    });

    it('should not produce empty <m:e/> for isotope notation', () => {
      const mathMl = latex2MathMl('{}^{235}_{92}\\text{U}');
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(!omml.includes('<m:e/>'), 'Should not contain empty <m:e/>');
    });

    it('should not produce empty <m:e/> for consecutive superscripts', () => {
      const mathMl = latex2MathMl('x^2{}^3');
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(!omml.includes('<m:e/>'), 'Should not contain empty <m:e/>');
    });

    it('should contain zero-width space for empty group in prescripts', () => {
      const mathMl = latex2MathMl('{}_a^b X');
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(omml.includes(ZERO_WIDTH_SPACE), 'Should contain zero-width space for empty group');
    });

    it('should contain zero-width space for empty group in isotope', () => {
      const mathMl = latex2MathMl('{}^{235}_{92}\\text{U}');
      const omml = convertMathMl2Omml(mathMl);
      assert.ok(omml.includes(ZERO_WIDTH_SPACE), 'Should contain zero-width space for empty group');
    });

    it('should not have empty m:t content for prescripts', () => {
      const mathMl = latex2MathMl('{}_a^b X');
      const omml = convertMathMl2Omml(mathMl);
      // Check that we don't have empty m:t tags (content length 0)
      const emptyMtPattern = /<m:t[^>]*><\/m:t>/;
      assert.ok(!emptyMtPattern.test(omml), 'Should not contain empty m:t elements');
    });
  });

  describe('convertMathMl2Omml - column alignment handling', () => {
    it('should preserve right-left alignment for aligned environment', () => {
      const mathMl = latex2MathMl('\\begin{aligned} a &= b \\\\ &= c \\end{aligned}');
      const omml = convertMathMl2Omml(mathMl);
      // Check that we have separate m:mc elements with correct alignments
      assert.ok(omml.includes('<m:mcJc m:val="right"/>'), 'First column should be right-aligned');
      assert.ok(omml.includes('<m:mcJc m:val="left"/>'), 'Second column should be left-aligned');
    });

    it('should have two m:mc elements for two-column aligned', () => {
      const mathMl = latex2MathMl('\\begin{aligned} x &= 1 \\end{aligned}');
      const omml = convertMathMl2Omml(mathMl);
      // Count m:mc elements
      const mcCount = (omml.match(/<m:mc>/g) || []).length;
      assert.strictEqual(mcCount, 2, 'Should have 2 m:mc elements for 2-column table');
    });

    it('should preserve center alignment for matrix', () => {
      const mathMl = latex2MathMl('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}');
      const omml = convertMathMl2Omml(mathMl);
      // Matrix columns should be center-aligned
      assert.ok(omml.includes('<m:mcJc m:val="center"/>'), 'Matrix columns should be center-aligned');
    });
  });
});