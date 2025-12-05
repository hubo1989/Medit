import { convertToXmlComponent } from 'docx';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { SerializedMmlVisitor } from 'mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js';
import { STATE } from 'mathjax-full/js/core/MathItem.js';
import { mml2omml } from './mml2omml.js';
import { xml2js } from 'xml-js';

let mathJaxEnvironment = null;
let mathJaxInitializing = null;

// Exclude bussproofs because it requires layout features that depend on typesetting output jax.
const TEX_PACKAGES = AllPackages.filter((pkg) => pkg !== 'bussproofs');

// LaTeX commands that MathJax doesn't support, mapped to Unicode characters
// These are typically from packages like esint, stmaryrd, etc.
const UNSUPPORTED_LATEX_COMMANDS = {
  // Integral variants (esint package)
  '\\oiint': '\u222F', // ∯ surface integral
  '\\oiiint': '\u2230', // ∰ volume integral
  '\\varointclockwise': '\u2232', // ∲ clockwise contour integral
  '\\ointctrclockwise': '\u2233', // ∳ anticlockwise contour integral
  '\\intclockwise': '\u2231', // ∱ clockwise integral

  // Additional symbols that might not be supported
  '\\amalg': '\u2A3F', // ⨿ amalgamation
};

/**
 * Preprocess LaTeX string to replace unsupported commands with Unicode equivalents.
 * This allows commands from packages like esint to work without MathJax support.
 */
function preprocessLatexCommands(latexString) {
  let result = latexString;
  for (const [command, unicode] of Object.entries(UNSUPPORTED_LATEX_COMMANDS)) {
    // Use regex to match the command (with word boundary to avoid partial matches)
    const regex = new RegExp(command.replace(/\\/g, '\\\\') + '(?![a-zA-Z])', 'g');
    result = result.replace(regex, unicode);
  }
  return result;
}

export function convertMathMl2Omml(mathMlString) {
  return mml2omml(mathMlString, { disableDecode: true });
}

function convertOmml2Math(ommlString) {
  const parsed = xml2js(ommlString, {
    compact: false,
    ignoreDeclaration: true,
    ignoreComment: true,
    captureSpacesBetweenElements: true,
  });

  const elements = parsed?.elements ?? [];
  const mathElement = elements.find((element) => element.type === 'element' && element.name === 'm:oMath');

  if (!mathElement) {
    throw new Error('Invalid OMML content: missing m:oMath element');
  }

  const component = convertToXmlComponent(mathElement);

  if (!component || component.rootKey !== 'm:oMath') {
    throw new Error('Failed to convert OMML element');
  }

  return component;
}

function convertMathMl2Math(mathMlString) {
  const ommlString = convertMathMl2Omml(mathMlString);
  return convertOmml2Math(ommlString);
}

function ensureMathJaxEnvironment() {
  if (mathJaxEnvironment) {
    return mathJaxEnvironment;
  }

  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);

  const tex = new TeX({ packages: TEX_PACKAGES });
  const document = mathjax.document('', {
    InputJax: tex,
  });

  const visitor = new SerializedMmlVisitor();

  mathJaxEnvironment = { adaptor, document, visitor };
  return mathJaxEnvironment;
}

export async function mathJaxReady() {
  if (mathJaxEnvironment) {
    return true;
  }

  if (mathJaxInitializing) {
    await mathJaxInitializing;
    return true;
  }

  mathJaxInitializing = Promise.resolve().then(() => {
    ensureMathJaxEnvironment();
  });

  await mathJaxInitializing;
  mathJaxInitializing = null;
  return true;
}

function latex2MathMl(latexString) {
  if (typeof latexString !== 'string') {
    throw new Error('latex2MathMl expects a string input');
  }

  // Preprocess unsupported LaTeX commands to Unicode equivalents
  const preprocessed = preprocessLatexCommands(latexString);

  const { document, visitor } = ensureMathJaxEnvironment();
  const mathNode = document.convert(preprocessed, {
    display: false,
    end: STATE.CONVERT,
  });

  return visitor.visitTree(mathNode);
}

export function convertLatex2Math(latexString) {
  const mathMlString = latex2MathMl(latexString);
  return convertMathMl2Math(mathMlString);
}

export { convertMathMl2Math, convertOmml2Math };
