"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileScanner = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class FileScanner {
    constructor(options = {}) {
        this.ignorePatterns = (options.ignorePatterns || [
            'node_modules/**',
            '*.min.js',
            'dist/**',
            'build/**',
            '.git/**',
            'coverage/**'
        ]).map(pattern => new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')));
        this.extensions = new Set(options.extensions || ['.js', '.ts', '.jsx', '.tsx']);
        this.readContents = options.readContents ?? false;
        this.maxFileSize = options.maxFileSize ?? 1024 * 1024; // 1MB default
    }
    async scan(targetPath) {
        const result = { files: [], fileContents: [], errors: [] };
        try {
            await this.scanDirectory(path.resolve(targetPath), result);
        }
        catch (error) {
            result.errors.push(`Failed to scan ${targetPath}: ${error}`);
        }
        return result;
    }
    async scanDirectory(dirPath, result) {
        let entries;
        try {
            entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        }
        catch (error) {
            result.errors.push(`Cannot read directory ${dirPath}: ${error}`);
            return;
        }
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(process.cwd(), fullPath);
            if (this.shouldIgnore(relativePath)) {
                continue;
            }
            if (entry.isDirectory()) {
                await this.scanDirectory(fullPath, result);
            }
            else if (entry.isFile() && this.isTargetFile(entry.name)) {
                result.files.push(fullPath);
                if (this.readContents) {
                    await this.readFileContent(fullPath, result);
                }
            }
        }
    }
    async readFileContent(filePath, result) {
        try {
            // Check file size first to avoid reading huge files
            const stats = await fs.promises.stat(filePath);
            if (stats.size > this.maxFileSize) {
                result.errors.push(`File too large (${stats.size} bytes): ${filePath}`);
                return;
            }
            const content = await fs.promises.readFile(filePath, 'utf8');
            result.fileContents.push({
                path: filePath,
                content,
                size: stats.size
            });
        }
        catch (error) {
            result.errors.push(`Cannot read file ${filePath}: ${error}`);
        }
    }
    shouldIgnore(filePath) {
        return this.ignorePatterns.some(pattern => pattern.test(filePath));
    }
    isTargetFile(fileName) {
        const ext = path.extname(fileName);
        return this.extensions.has(ext);
    }
}
exports.FileScanner = FileScanner;
//# sourceMappingURL=scanner.js.map