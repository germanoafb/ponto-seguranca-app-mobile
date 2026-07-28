import { ActivityIndicator, Image, Modal, Pressable, Text, View } from 'react-native';
import { CameraView, useCameraPermissions                       } from 'expo-camera';
import { useRef, useState   } from 'react';
import { Camera, RotateCcw  } from 'lucide-react-native';
import { getCurrentLocation } from '../lib/geolocation';

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';

export type CaptureMetadata = {
  latitude: number | null;
  longitude: number | null;
  capturedAtIso: string;
};

type Props = {
  selfieUri: string | null;
  onChange: (uri: string | null) => void;
  onMetadataChange?: (metadata: CaptureMetadata | null) => void;
};

const SAFE_TARGET_BYTES = 160_000;
const OVERLAY_WIDTH = 360;

function formatCoordinates(latitude: number | null, longitude: number | null): string {
  if (latitude === null || longitude === null) {
    return 'Local: indisponível';
  }
  return `Local: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

async function compressToTarget(uri: string): Promise<string> {
  let quality = 0.8;
  let width = OVERLAY_WIDTH;
  let result = uri;

  for (let i = 0; i < 8; i += 1) {
    const manipulated = await ImageManipulator.manipulateAsync(
      result,
      [{ resize: { width } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    const info = await FileSystem.getInfoAsync(manipulated.uri, { size: true });
    const size = info.exists && 'size' in info ? info.size : Infinity;

    if (size <= SAFE_TARGET_BYTES) {
      return manipulated.uri;
    }

    result = manipulated.uri;
    if (quality > 0.35) {
      quality -= 0.1;
    } else {
      width = Math.floor(width * 0.85);
    }
  }

  return result;
}

export default function CameraCapture({ selfieUri, onChange, onMetadataChange }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Estado usado só pra renderizar a view "invisível" que vira o carimbo
  const [pendingCapture, setPendingCapture] = useState<{
    photoUri: string;
    aspect: number;
    metadata: CaptureMetadata;
  } | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const viewShotRef = useRef<ViewShot>(null);

  const openCamera = async () => {
    setError('');
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setError('Permissão da câmera negada. Ative nas configurações do dispositivo.');
        return;
      }
    }
    setCameraOpen(true);
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      setCameraOpen(false);

      const location = await getCurrentLocation();
      const metadata: CaptureMetadata = {
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        capturedAtIso: new Date().toISOString(),
      };

      setProcessing(true);
      setPendingCapture({
        photoUri: photo.uri,
        aspect: photo.width && photo.height ? photo.height / photo.width : 1,
        metadata,
      });
      // A captura final acontece no onLoad da <Image>, dentro do ViewShot,
      // pra garantir que a imagem já esteja desenhada antes do "print".
    } catch {
      setError('Não foi possível capturar a foto.');
    }
  };

  const handleOverlayReady = async () => {
    if (!pendingCapture || !viewShotRef.current?.capture) return;

    try {
      const stampedUri = await viewShotRef.current.capture();
      const finalUri = await compressToTarget(stampedUri);

      onChange(finalUri);
      onMetadataChange?.(pendingCapture.metadata);
      setError('');
    } catch {
      setError('Não foi possível processar a selfie.');
      onChange(null);
      onMetadataChange?.(null);
    } finally {
      setProcessing(false);
      setPendingCapture(null);
    }
  };

  const handleRetake = () => {
    onChange(null);
    onMetadataChange?.(null);
    setError('');
    openCamera();
  };

  const now = pendingCapture ? new Date(pendingCapture.metadata.capturedAtIso) : null;
  const timeText = now
    ? new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)
    : '';
  const weekdayText = now
    ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(now)
    : '';
  const dateText = now
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(now)
    : '';
  const weekdayCapitalized = weekdayText
    ? weekdayText.charAt(0).toUpperCase() + weekdayText.slice(1)
    : '';

  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-slate-700">Selfie (obrigatória)</Text>

      <Pressable
        onPress={selfieUri ? handleRetake : openCamera}
        disabled={processing}
        className="flex-row items-center self-start rounded-md bg-blue-600 px-4 py-2"
      >
        {selfieUri ? (
          <RotateCcw size={16} color="#ffffff" />
        ) : (
          <Camera size={16} color="#ffffff" />
        )}
        <Text className="ml-2 text-sm font-medium text-white">
          {selfieUri ? 'Tirar outra foto' : 'Tirar foto'}
        </Text>
      </Pressable>

      <View className="mt-3">
        {processing && (
          <View className="w-32 h-32 items-center justify-center rounded-lg border border-slate-300 bg-slate-100">
            <ActivityIndicator color="#2563eb" />
          </View>
        )}

        {!processing && selfieUri && (
          <Image
            source={{ uri: selfieUri }}
            className="w-32 h-32 rounded-lg border border-slate-300"
            resizeMode="cover"
          />
        )}

        {!processing && !selfieUri && (
          <Text className="text-xs text-slate-500">Nenhuma selfie selecionada.</Text>
        )}

        {!!error && <Text className="mt-2 text-xs text-red-600">{error}</Text>}
      </View>

      {/* View "invisível" usada só para gerar a imagem com o carimbo */}
      {pendingCapture && (
        <View style={{ position: 'absolute', top: -9999, left: -9999 }}>
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
            <View
              style={{
                width: OVERLAY_WIDTH,
                height: OVERLAY_WIDTH * pendingCapture.aspect,
              }}
            >
              <Image
                source={{ uri: pendingCapture.photoUri }}
                onLoad={handleOverlayReady}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  left: 10,
                  right: 10,
                  bottom: 10,
                  backgroundColor: 'rgba(14, 37, 108, 0.62)',
                  borderRadius: 4,
                  padding: 10,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 26 }}>
                  {timeText}
                </Text>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, marginTop: 4 }}>
                  {weekdayCapitalized} - {dateText}
                </Text>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12, marginTop: 4 }}>
                  {formatCoordinates(pendingCapture.metadata.latitude, pendingCapture.metadata.longitude)}
                </Text>
              </View>
            </View>
          </ViewShot>
        </View>
      )}

      {/* Câmera em tela cheia */}
      <Modal visible={cameraOpen} animationType="slide">
        <View className="flex-1 bg-black">
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />
          <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between px-8 pb-10 pt-4">
            <Pressable
              onPress={() => setCameraOpen(false)}
              className="rounded-full bg-white/20 px-4 py-2"
            >
              <Text className="text-white">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleTakePicture}
              className="h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/30"
            />
            <View className="w-16" />
          </View>
        </View>
      </Modal>
    </View>
  );
}
