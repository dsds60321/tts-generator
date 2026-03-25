from __future__ import annotations

import unittest

from app.providers.melo_provider import MeloTTSProvider
from app.providers.openvoice_provider import OpenVoiceProvider
from app.services.provider_factory import ProviderFactory


class ProviderFactoryTest(unittest.TestCase):
    def test_return_melo_provider_for_system_voice(self) -> None:
        factory = ProviderFactory()
        provider = factory.get("melo", "KR")
        self.assertIsInstance(provider, MeloTTSProvider)

    def test_return_openvoice_provider_for_reference_voice(self) -> None:
        factory = ProviderFactory()
        provider = factory.get("melo", "sample:민지")
        self.assertIsInstance(provider, OpenVoiceProvider)


if __name__ == "__main__":
    unittest.main()
