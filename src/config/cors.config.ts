import { ConfigService } from '@nestjs/config'

export function getCorsConfig(config: ConfigService) {
    const originsString = config.getOrThrow<string>('ALLOWED_ORIGIN')
    const originsArray = originsString.split(',').map(origin => origin.trim())
    return {
        origin: originsArray,
        credentials: true,
        exposedHeaders: ['Authorization']
    }
}
