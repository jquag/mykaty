import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SERVICE_ICONS, ServiceKey } from '@/constants/services';

interface Props {
	service: ServiceKey;
	color: string;
	size?: number;
}

export default function ServiceIcon({ service, color, size = 18 }: Props) {
	const icon = SERVICE_ICONS[service];
	return icon.set === 'ionicons'
		? <Ionicons name={icon.name} size={size} color={color} />
		: <MaterialCommunityIcons name={icon.name} size={size} color={color} />;
}
