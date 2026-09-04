"""Pytest bootstrap: mock genlayer so Studio contract files can be imported."""

from __future__ import annotations

import sys
import types
from pathlib import Path


def _install_fake_genlayer() -> None:
    existing = sys.modules.get("genlayer")
    if existing is not None and getattr(existing, "_dealguard_fake", False):
        return

    gl = types.ModuleType("genlayer")
    gl._dealguard_fake = True

    class _Public:
        @staticmethod
        def write(fn):
            return fn

        @staticmethod
        def view(fn):
            return fn

    class _EqPrinciple:
        @staticmethod
        def prompt_comparative(leader_fn, principle=""):
            return leader_fn()

        @staticmethod
        def strict_eq(leader_fn):
            return leader_fn()

    def _strict_eq(leader_fn):
        return leader_fn()

    gl.Contract = object
    gl.public = _Public()
    gl.message = types.SimpleNamespace(
        sender_address="0x1111111111111111111111111111111111111111"
    )
    gl.eq_principle = _EqPrinciple()
    gl.eq_principle_strict_eq = _strict_eq
    gl.get_webpage = lambda url, mode="text": "Hello world! GenLayer fixture page"
    gl.nondet = types.SimpleNamespace(
        exec_prompt=lambda prompt, response_format="json": '{"pay_provider": true}'
    )
    gl.exec_prompt = lambda prompt: '{"pay_provider": true}'
    gl.gl = gl
    sys.modules["genlayer"] = gl


def load_contract(repo_root: Path, filename: str = "DealGuard.py"):
    _install_fake_genlayer()
    path = repo_root / "contracts" / filename
    text = path.read_text(encoding="utf-8")
    text = text.replace("from genlayer import *", "# genlayer mocked in tests")
    mod_name = f"contract_{filename.replace('.', '_')}"
    module = types.ModuleType(mod_name)
    gl = sys.modules["genlayer"]
    module.__dict__["gl"] = gl
    code = compile(text, str(path), "exec")
    exec(code, module.__dict__)
    sys.modules[mod_name] = module
    return module
