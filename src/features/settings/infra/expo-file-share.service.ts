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

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return content;
    } catch (error) {
      console.error('[ExpoFileShareService] Erro ao selecionar arquivo:', error);
      throw error;
    }
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
