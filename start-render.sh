#!/bin/sh
set -eu

# Render mounts persistent disks before starting the container. Keep the app
# code in /evolution and place mutable instance/store data on the mounted disk.
if [ -n "${PERSISTENT_DATA_DIR:-}" ]; then
  mkdir -p "$PERSISTENT_DATA_DIR/instances" "$PERSISTENT_DATA_DIR/store"

  for name in instances store; do
    source_dir="/evolution/$name"
    target_dir="$PERSISTENT_DATA_DIR/$name"

    if [ -L "$source_dir" ]; then
      continue
    fi

    if [ -d "$source_dir" ] && [ -z "$(ls -A "$target_dir")" ]; then
      cp -R "$source_dir/." "$target_dir/" 2>/dev/null || true
    fi

    rm -rf "$source_dir"
    ln -s "$target_dir" "$source_dir"
  done
fi

exec node ./dist/src/main.js
