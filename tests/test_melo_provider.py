from __future__ import annotations

import os
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from app.providers.melo_provider import MeloTTSProvider


class MeloTTSProviderRuntimeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.provider = MeloTTSProvider()

    def test_enable_offline_mode_when_required_cache_exists(self) -> None:
        with TemporaryDirectory() as tmp_dir:
            cache_root = Path(tmp_dir) / "hub"
            for model_id in self.provider._HF_MODEL_IDS_BY_LANGUAGE["KR"]:
                self._create_cached_model(cache_root, model_id)

            with patch.dict(os.environ, {}, clear=True):
                self.provider._configure_huggingface_runtime("KR", cache_root=cache_root)
                self.assertEqual(os.environ["HF_HUB_OFFLINE"], "1")
                self.assertEqual(os.environ["TRANSFORMERS_OFFLINE"], "1")

    def test_skip_offline_mode_when_cache_is_incomplete(self) -> None:
        with TemporaryDirectory() as tmp_dir:
            cache_root = Path(tmp_dir) / "hub"
            self._create_cached_model(cache_root, "myshell-ai/MeloTTS-Korean")

            with patch.dict(os.environ, {}, clear=True):
                self.provider._configure_huggingface_runtime("KR", cache_root=cache_root)
                self.assertNotIn("HF_HUB_OFFLINE", os.environ)
                self.assertNotIn("TRANSFORMERS_OFFLINE", os.environ)

    def _create_cached_model(self, cache_root: Path, model_id: str) -> None:
        snapshot_dir = cache_root / self.provider._huggingface_model_cache_name(model_id) / "snapshots" / "test"
        snapshot_dir.mkdir(parents=True, exist_ok=True)


if __name__ == "__main__":
    unittest.main()
