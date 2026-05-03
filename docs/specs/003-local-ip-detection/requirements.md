## User Story

Given the server starts on a machine connected to a local WiFi network,
When `node server.js` runs,
Then the terminal prints the machine's local IPv4 address so the developer can share the phone URL without manually looking up the IP.

## Acceptance Criteria

1. On startup, the server detects the machine's local (LAN) IPv4 address using Node's built-in `os` module — no external packages.
2. The terminal prints a line in the format: `Dashboard: http://[IP]:3000`
3. The terminal prints a second line in the format: `Phone:     http://[IP]:3000/phone`
4. The detected IP is a private address (starts with `192.168.`, `10.`, or `172.16.`–`172.31.`), not `127.0.0.1`.
5. The detected IP is stored in a module-level variable (e.g., `const LOCAL_IP`) so it can be reused by the QR code endpoint in T-04.
6. If no suitable non-loopback IPv4 address is found, the server falls back to `127.0.0.1` and logs a warning to `stderr`.
7. The IP detection runs synchronously before the `server.listen` callback fires, so the printed URLs are accurate.

## Gotchas & Edge Cases

- A machine may have multiple network interfaces (e.g., Ethernet and WiFi, WSL virtual adapters, Docker bridges, VPN tunnels). The code must pick the correct one — prefer the first non-internal IPv4 address on a `'IPv4'` family interface.
- On WSL2, `os.networkInterfaces()` returns both the WSL virtual NIC and the Windows host adapter. The WSL virtual NIC (`172.x.x.x`) is LAN-accessible from other devices on the same network only if Windows firewall rules allow it — in practice the `192.168.x.x` or `10.x.x.x` address from the Windows WiFi adapter is the one the phone should use. Verify the printed IP is reachable from the phone.
- VPN connections often inject a `tun0` or `utun` interface with a private IP that is not on the LAN. If the machine has a VPN active, the detected IP may be wrong. Document this limitation.
- `os.networkInterfaces()` returns `undefined` for interfaces with no addresses. Guard against this.
- The iteration order of `os.networkInterfaces()` is not guaranteed by the spec — the chosen heuristic (first non-internal IPv4) may need adjustment per environment.
