// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Library {
    struct LibraryItem {
        string id;
        string title;
        string summary;
        string content;
        string url;
        string image;
        string date;
        string metadata;
    }
    
    struct LibraryData {
        string dataType;
        string[] tags;
        uint256 timestamp;
        string source;
        LibraryItem[] items;
        bool exists;
    }
    
    uint256 public libraryCount;
    mapping(uint256 => LibraryData) public libraries;
    
    event LibraryCreated(
        uint256 indexed libraryId,
        string dataType,
        uint256 timestamp,
        string source
    );
    
    function createLibrary(
        string memory dataType,
        string[] memory tags,
        LibraryItem[] memory items,
        string memory source
    ) external returns (uint256 libraryId) {
        libraryCount++;
        libraryId = libraryCount;

        LibraryData storage lib = libraries[libraryId];
        lib.dataType = dataType;
        lib.tags = tags;
        lib.timestamp = block.timestamp;
        lib.source = source;
        lib.exists = true;

        for (uint256 i = 0; i < items.length; i++) {
            lib.items.push(items[i]);
        }

        emit LibraryCreated(libraryId, dataType, block.timestamp, source);

        return libraryId;
    }
    
    function getAllLibraries() external view returns (
        uint256[] memory libraryIds,
        string[] memory dataTypes,
        uint256[] memory timestamps,
        string[] memory sources
    ) {
        libraryIds = new uint256[](libraryCount);
        dataTypes = new string[](libraryCount);
        timestamps = new uint256[](libraryCount);
        sources = new string[](libraryCount);

        for (uint256 i = 1; i <= libraryCount; i++) {
            LibraryData storage lib = libraries[i];
            if (lib.exists) {
                libraryIds[i - 1] = i;
                dataTypes[i - 1] = lib.dataType;
                timestamps[i - 1] = lib.timestamp;
                sources[i - 1] = lib.source;
            }
        }

        return (libraryIds, dataTypes, timestamps, sources);
    }
    
    function getLibrary(uint256 libraryId) external view returns (
        string memory dataType,
        string[] memory tags,
        uint256 timestamp,
        string memory source,
        LibraryItem[] memory items
    ) {
        LibraryData storage lib = libraries[libraryId];
        require(lib.exists, "Library does not exist");
        
        return (lib.dataType, lib.tags, lib.timestamp, lib.source, lib.items);
    }
}
