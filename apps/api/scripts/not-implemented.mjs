const [, , name = "script", reason = "Chưa được triển khai ở bước hiện tại."] = process.argv;

console.error(`${name} chưa sẵn sàng: ${reason}`);
process.exit(1);
