"""
Safety-GUARD — C++/Cython Extension Build Script

Usage:
    python setup.py build_ext --inplace

Requirements:
    pip install cython
    C++17 compatible compiler (gcc >= 7, clang >= 5, MSVC 2017+)

The compiled module (risk_calculator.so / risk_calculator.pyd) will be placed
in this directory. Import it from Python as:
    from cpp import risk_calculator as rc
    result = rc.calculate_risk(current_point, previous_point, hour_of_day=22.0)
"""

from setuptools import setup, Extension

try:
    from Cython.Build import cythonize
    USE_CYTHON = True
except ImportError:
    USE_CYTHON = False
    print("Warning: Cython not found. Using pre-generated C++ source.")

sources = ["risk_calculator.pyx", "risk_calculator.cpp", "geofence.cpp"] \
          if USE_CYTHON else \
          ["risk_calculator.cpp", "geofence.cpp"]

ext = Extension(
    name="risk_calculator",
    sources=sources,
    extra_compile_args=["-O2", "-std=c++17"],
    language="c++",
)

setup(
    name="safeguard-ai-engine",
    version="1.0.0",
    description="Safety-GUARD high-performance AI risk engine (C++/Cython)",
    ext_modules=cythonize([ext], compiler_directives={"language_level": "3"})
                if USE_CYTHON else [ext],
)
