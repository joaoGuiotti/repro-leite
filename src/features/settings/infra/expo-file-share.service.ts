import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { FileShareService } from '../domain/file-share.service';

export class ExpoFileShareService implements FileShareService {
  async shareFile(options: {
    filename: string;
    content: string;
    mimeType: string;
    dialogTitle: string;
  }): Promise<boolean> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        throw new Error('Diretório de cache não disponível no dispositivo.');
      }

      const fileUri = `${cacheDir}${options.filename}`;
      await FileSystem.writeAsStringAsync(fileUri, options.content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        // Fallback: em ambientes sem folha de compartilhamento nativa (ex: simulador ou desktop)
        return false;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: options.mimeType,
        dialogTitle: options.dialogTitle,
      });

      return true;
    } catch (error) {
      console.error('[ExpoFileShareService] Erro ao compartilhar arquivo:', error);
      throw error;
    }
  }

  async pickJsonFile(): Promise<string | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return await this.readAssetContent(asset);
    } catch (error) {
      console.error('[ExpoFileShareService] Erro ao selecionar arquivo:', error);
      throw error;
    }
  }

  private async readAssetContent(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
    const fileUri = asset.uri;

    // 1. Tentar ler diretamente pelo objeto File nativo se presente (ex: Web)
    if (asset.file && typeof (asset.file as any).text === 'function') {
      try {
        const text = await (asset.file as any).text();
        if (text && typeof text === 'string') {
          return text;
        }
      } catch {
        // Prossegue para os outros métodos
      }
    }

    // 2. Tentar ler via fetch (no React Native, fetch suporta esquemas file:// e content:// via Android ContentResolver)
    try {
      const response = await fetch(fileUri);
      const text = await response.text();
      if (text && typeof text === 'string' && text.trim().length > 0) {
        return text;
      }
    } catch {
      // Falha esperada em alguns ambientes, tenta via FileSystem
    }

    // 3. Tentar ler via FileSystem.readAsStringAsync
    try {
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (content && typeof content === 'string') {
        return content;
      }
    } catch (fsError) {
      console.warn('[ExpoFileShareService] Falha ao ler via readAsStringAsync direto:', fsError);
    }

    // 4. Se o URI tiver prefixo file://, tentar sem ele caso FileSystem reclame de URL inválida
    if (fileUri.startsWith('file://')) {
      try {
        const rawPath = fileUri.replace('file://', '');
        const content = await FileSystem.readAsStringAsync(rawPath, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        if (content) {
          return content;
        }
      } catch {
        // Ignora
      }
    }

    throw new Error(
      'Não foi possível ler o arquivo selecionado. Verifique se o arquivo é válido e tente novamente.'
    );
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setStringAsync(text);
    } catch (error) {
      console.error('[ExpoFileShareService] Erro ao copiar para área de transferência:', error);
      throw error;
    }
  }
}
